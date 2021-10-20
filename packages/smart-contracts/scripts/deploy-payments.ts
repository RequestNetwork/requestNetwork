import '@nomiclabs/hardhat-ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import {
  chainlinkConversionPath as chainlinkConversionPathArtifact,
  ContractArtifact,
  erc20FeeProxyArtifact,
  erc20SwapToPayArtifact,
  ethereumFeeProxyArtifact,
  ethereumProxyArtifact,
} from '../src/lib';
import { deploySwapConversion } from './erc20-swap-to-conversion';
import { deployERC20ConversionProxy, deployETHConversionProxy } from './conversion-proxy';
import { DeploymentResult, deployOne } from './deploy-one';
import { uniswapV2RouterAddresses } from './utils';
import { Contract } from 'ethers';
import { ChainlinkConversionPath } from '../src/types/ChainlinkConversionPath';

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
export async function deployAllPaymentContracts(
  args: any,
  hre: HardhatRuntimeEnvironment,
): Promise<void> {
  const deploymentResults: DeploymentResult[] = [];

  try {
    const [deployer] = await hre.ethers.getSigners();

    console.log(
      `*** Deploying with the account: ${deployer.address} on the network ${hre.network.name} (${hre.network.config.chainId}) ***`,
    );

    // #region EASY DEPLOYMENTS UTIL

    // Utility to run a straight-forward deployment with deployOne()
    const runEasyDeployment = async <TContract extends Contract>(deployment: {
      contractName: string;
      constructorArguments?: string[];
      artifact: ContractArtifact<TContract>;
    }): Promise<DeploymentResult<TContract>> => {
      deployment.constructorArguments = deployment.constructorArguments ?? [];
      const result = await deployOne<TContract>(args, hre, deployment.contractName, {
        ...deployment,
      });
      deploymentResults.push(result);
      console.log(`Contract ${deployment.contractName} ${result.type}: ${result.address}`);
      return result;
    };
    // #endregion

    // #region NON-EASY BATCHES DEFINITION

    /*
     * Batch 2
     *   - ERC20ConversionProxy
     *   - ERC20SwapToPay
     *   - ERC20SwapToConversion
     */

    const runDeploymentBatch_2 = async (
      chainlinkInstance: ChainlinkConversionPath,
      erc20FeeProxyAddress: string,
    ) => {
      // Deploy ERC20 Conversion
      const erc20ConversionResult = await deployERC20ConversionProxy(
        {
          ...args,
          chainlinkConversionPathAddress: chainlinkInstance.address,
          erc20FeeProxyAddress,
        },
        hre,
      );
      deploymentResults.push(erc20ConversionResult);
      const erc20ConversionAddress = erc20ConversionResult?.address;

      // Add whitelist admin to chainlink path
      if (chainlinkInstance) {
        if (!process.env.ADMIN_WALLET_ADDRESS) {
          throw new Error('Chainlink was deployed but no ADMIN_WALLET_ADDRESS was provided.');
        }
        if (args.simulate === false) {
          await chainlinkInstance.addWhitelistAdmin(process.env.ADMIN_WALLET_ADDRESS);
        }
      }

      // ERC20SwapToPay & ERC20SwapToConversion
      const swapRouterAddress = uniswapV2RouterAddresses[hre.network.name];
      if (swapRouterAddress) {
        const swapRouterAddressResult = await deployOne(args, hre, 'ERC20SwapToPay', {
          constructorArguments: [swapRouterAddress, erc20FeeProxyAddress],
          artifact: erc20SwapToPayArtifact,
        });
        deploymentResults.push(swapRouterAddressResult);

        if (erc20ConversionAddress) {
          const swapConversionResult = await deploySwapConversion(
            {
              ...args,
              conversionProxyAddress: erc20ConversionAddress,
              swapProxyAddress: swapRouterAddress,
            },
            hre,
          );
          deploymentResults.push(swapConversionResult);
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
      return deploymentResults;
    };

    /*
     * Batch 4
     *   - ETHConversionProxy
     */
    const runDeploymentBatch_4 = async (
      chainlinkConversionPathAddress: string,
      ethFeeProxyAddress: string,
    ) => {
      // Deploy ETH Conversion
      const ethConversionResult = await deployETHConversionProxy(
        {
          ...args,
          chainlinkConversionPathAddress,
          ethFeeProxyAddress,
        },
        hre,
      );
      deploymentResults.push(ethConversionResult);
    };

    // #endregion

    // #region MAIN - Deployments

    // Batch 1
    await runEasyDeployment({
      contractName: 'EthereumProxy',
      artifact: ethereumProxyArtifact,
    });
    const { address: erc20FeeProxyAddress } = await runEasyDeployment({
      contractName: 'ERC20FeeProxy',
      artifact: erc20FeeProxyArtifact,
    });

    const { instance: chainlinkInstance } = await runEasyDeployment({
      contractName: 'ChainlinkConversionPath',
      artifact: chainlinkConversionPathArtifact,
    });

    // Batch 2
    await runDeploymentBatch_2(chainlinkInstance, erc20FeeProxyAddress);

    // Batch 3
    const { address: ethFeeProxyAddress } = await runEasyDeployment({
      contractName: 'EthereumFeeProxy',
      artifact: ethereumFeeProxyArtifact,
    });

    // Batch 4
    await runDeploymentBatch_4(chainlinkInstance.address, ethFeeProxyAddress);

    // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Add future batches above this line

    console.log('Done deploying. Summary:');
    deploymentResults.forEach((res) => {
      console.log(`      ${res.contractName.concat(':').padEnd(30, ' ')}${res.address}`);
    });
    // #endregion
  } catch (e) {
    console.error(e);
  }

  const nbDeployments = deploymentResults.filter((val) => val.type === 'deployed').length;
  const verificationPromises = deploymentResults
    .map((val) => val.verificationPromise)
    .filter(Boolean);

  // #region MAIN - Conclusion and verification
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
            `*     OTHER: deploy subgraphes where needed`,
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
  // #endregion
}
