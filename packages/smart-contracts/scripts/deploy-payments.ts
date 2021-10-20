import '@nomiclabs/hardhat-ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import {
  chainlinkConversionPath as chainlinkConversionPathArtifact,
  erc20FeeProxyArtifact,
  erc20SwapToPayArtifact,
  ethereumFeeProxyArtifact,
  ethereumProxyArtifact,
} from '../src/lib';
import { deploySwapConversion } from './erc20-swap-to-conversion';
import { deployERC20ConversionProxy, deployETHConversionProxy } from './conversion-proxy';
import { DeploymentResult, deployOne } from './deploy-one';
import { uniswapV2RouterAddresses } from './utils';

/**
 * Script ensuring all payment contracts are deployed and usable on a live chain.
 *
 * For a given chain, in the absence of `args.simulate` and `args.force`, the script is responsible for:
 * - Deploying contracts in the exact same sequence on every chain, to keep the same addresses
 * - Deploying only contracts which, according to the artifacts in `src/lib/artifacts`, are not yet deployed on the chain
 * - Doing the minimum required administration tasks (typically: handover administration to other wallets)
 * - Verifying the contract code of deployed contracts on the appropriate explorer, when relevant
 * - Switching to simulation mode if any deployment cannot be made (in order to keep the sequence)
 *
 * `args.force = true` to force deployments even if addresses are found in the artifacts (eg. on private network)
 * `args.simulate = true` to prevent deployments and contract verification
 *
 */
export async function deployAllPaymentContracts(args: any, hre: HardhatRuntimeEnvironment) {
  let nbDeployments = 0;
  let verificationPromises: Promise<boolean>[] = [];

  let chainlinkConversionPathAddress: string;
  let erc20FeeProxyAddress: string;

  const deploymentResults: DeploymentResult[] = [];

  // Count deployments and track verification promises
  const concludeDeployment = (deploymentResult?: DeploymentResult) => {
    if (!deploymentResult) return;
    nbDeployments += deploymentResult?.type === 'deployed' ? 1 : 0;
    deploymentResults.push(deploymentResult);
    if (deploymentResult?.verificationPromise) {
      verificationPromises.push(deploymentResult.verificationPromise);
    }
  };

  try {
    const [deployer] = await hre.ethers.getSigners();

    console.log(
      `*** Deploying with the account: ${deployer.address} on the network ${hre.network.name} (${hre.network.config.chainId}) ***`,
    );

    // ----------------------------------
    // STANDARD BATCHES
    // ----------------------------------

    const standardBatches = [
      // Batch 1
      [
        {
          contractName: 'EthereumProxy',
          constructorArguments: [],
          artifact: ethereumProxyArtifact,
        },
        {
          contractName: 'ERC20FeeProxy',
          constructorArguments: [],
          artifact: erc20FeeProxyArtifact,
        },
        {
          contractName: 'ChainlinkConversionPath',
          constructorArguments: [],
          artifact: chainlinkConversionPathArtifact,
        },
      ],
      // Batch 3
      [
        {
          contractName: 'EthereumFeeProxy',
          constructorArguments: [],
          artifact: ethereumFeeProxyArtifact,
        },
      ],
    ];
    let batchResults: Record<string, DeploymentResult>;

    // Utility to loop through many standard contract deployments
    let currentStandardBatch = 0;
    const runNextStandardBatch = async () => {
      const deployments = standardBatches[currentStandardBatch];
      const batchResult: Record<string, DeploymentResult> = {};

      // Deploy automated contracts (1/2)
      for (const deployment of deployments) {
        const result = await deployOne(args, hre, deployment.contractName, {
          ...deployment,
        });
        concludeDeployment(result);
        console.log(`Contract ${deployment.contractName} ${result.type}: ${result.address}`);
        batchResult[result.contractName] = result;
      }
      currentStandardBatch += 1;
      return batchResult;
    };

    // ----------------------------------
    // NON-STANDARD BATCHES
    // ----------------------------------

    /*
     * Batch 2
     *   - ERC20ConversionProxy
     *   - ERC20SwapToPay
     *   - ERC20SwapToConversion
     */

    const runDeploymentBatch_2 = async () => {
      // Deploy ERC20 Conversion
      const erc20ConversionResult = await deployERC20ConversionProxy(
        {
          ...args,
          chainlinkConversionPathAddress,
          erc20FeeProxyAddress,
        },
        hre,
      );
      concludeDeployment(erc20ConversionResult);
      const erc20ConversionAddress = erc20ConversionResult?.address;

      // Add whitelist admin to chainlink path
      if (batchResults['ChainlinkConversionPath']?.type === 'deployed') {
        if (!process.env.ADMIN_WALLET_ADDRESS) {
          throw new Error('Chainlink was deployed but no ADMIN_WALLET_ADDRESS was provided.');
        }
        if (args.simulate === false) {
          await batchResults['ChainlinkConversionPath'].instance.addWhitelistAdmin(
            process.env.ADMIN_WALLET_ADDRESS,
          );
        }
      }

      // ERC20SwapToPay & ERC20SwapToConversion
      const swapRouterAddress = uniswapV2RouterAddresses[hre.network.name];
      if (swapRouterAddress) {
        const swapRouterAddressResult = await deployOne(args, hre, 'ERC20SwapToPay', {
          constructorArguments: [swapRouterAddress, erc20FeeProxyAddress],
          artifact: erc20SwapToPayArtifact,
        });
        concludeDeployment(swapRouterAddressResult);

        if (erc20ConversionAddress) {
          const swapConversionResult = await deploySwapConversion(
            {
              ...args,
              conversionProxyAddress: erc20ConversionAddress,
              swapProxyAddress: swapRouterAddress,
            },
            hre,
          );
          concludeDeployment(swapConversionResult);
        } else {
          console.log(
            `      ${'ERC20SwapToConversion:'.padEnd(30, ' ')}(ERC20 Conversion missing)`,
          );
          console.log('[!] Switching to simulated mode');
          args.simulate = true;
        }
      } else {
        console.log(`      ${'ERC20SwapToPay:'.padEnd(30, ' ')}(swap router missing)`);
        console.log(`      ${'ERC20SwapToConversion:'.padEnd(30, ' ')}(swap router missing)`);
        console.log('[!] Switching to simulated mode');
        args.simulate = true;
      }
    };

    /*
     * Batch 4
     *   - ETHConversionProxy
     */

    const runDeploymentBatch_4 = async () => {
      // Deploy ETH Conversion
      const ethConversionResult = await deployETHConversionProxy(
        {
          ...args,
          chainlinkConversionPathAddress,
          ethFeeProxyAddress: batchResults['EthereumFeeProxy'].address,
        },
        hre,
      );
      concludeDeployment(ethConversionResult);
    };

    // ----------------------------------
    // MAIN - Deployments
    // ----------------------------------

    // Batch 1
    batchResults = await runNextStandardBatch();

    chainlinkConversionPathAddress = batchResults['ChainlinkConversionPath'].address;
    erc20FeeProxyAddress = batchResults['ERC20FeeProxy'].address;

    // Batch 2
    await runDeploymentBatch_2();

    // Batch 3
    batchResults = {
      ...batchResults,
      ...(await runNextStandardBatch()),
    };

    // Batch 4
    await runDeploymentBatch_4();

    // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Add future batches above this line

    console.log('Done deploying. Summary:');
    deploymentResults.forEach((res) => {
      console.log(`      ${res.contractName.concat(':').padEnd(30, ' ')}${res.address}`);
    });
  } catch (e) {
    console.error(e);
  }

  // ----------------------------------
  // MAIN - Conclusion and verification
  // ----------------------------------
  if (nbDeployments > 0) {
    console.log(
      `--- ${nbDeployments} deployements were made. ---`,
      hre.network.name === 'private'
        ? ''
        : [
            ``,
            `TODO:`,
            `*  CRITICAL: update src/lib/artifacts files, and push changes NOW !`,
            `* IMPORTANT: execute updateAggregatorsList() on conversionPaths`,
            `*          : then update the lib with chainlinkPath util in toolbox and push changes`,
            `*     OTHER: run \`yarn hardhat prepare-live-payments --network ${hre.network.name}\``,
            `*     OTHER: execute administration tasks: approveRouterToSpend(), approvePaymentProxyToSpend() on swaps`,
          ].join('\r\n'),
    );
    if (verificationPromises.length > 0) {
      let nbSuccessfulVerifications = 0;
      console.log('Contracts verifications in progress...');
      await Promise.all(
        verificationPromises.map((verificationPromise) => {
          return verificationPromise.then((success) => {
            nbSuccessfulVerifications += success ? 1 : 0;
            console.log(`${nbSuccessfulVerifications} / ${nbDeployments}...`);
          });
        }),
      );
      console.log(`${nbSuccessfulVerifications} verification successes !`);
      if (nbSuccessfulVerifications < nbDeployments) {
        console.log(`Some verifications failed, check logs and do them manually.`);
      }
    }
  } else {
    console.log(`--- No deployment was made. ---`);
  }
}
