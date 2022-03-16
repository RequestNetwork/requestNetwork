import '@nomiclabs/hardhat-ethers';
import {
  chainlinkConversionPath as chainlinkConversionPathArtifact,
  ContractArtifact,
  erc20FeeProxyArtifact,
  erc20SwapToPayArtifact,
} from '../src/lib';
import { deploySwapConversion } from './erc20-swap-to-conversion';
import { deployERC20ConversionProxy, deployETHConversionProxy } from './conversion-proxy';
import { DeploymentResult, deployOne } from './deploy-one';
import { uniswapV2RouterAddresses, jumpToNonce } from './utils';
import { Contract } from 'ethers';
// eslint-disable-next-line
// @ts-ignore Cannot find module
import { ChainlinkConversionPath } from '../src/types/ChainlinkConversionPath';
// eslint-disable-next-line
// @ts-ignore Cannot find module
import { ERC20SwapToConversion } from '../src/types/ERC20SwapToConversion';
import { CurrencyManager } from '@requestnetwork/currency';
import { RequestLogicTypes } from '@requestnetwork/types';
import { computeCreate2DeploymentAddress } from 'smart-contracts/scripts-create2/compute-one-address';
import { HardhatRuntimeEnvironmentExtended } from 'smart-contracts/scripts-create2/utils';

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
  hre: HardhatRuntimeEnvironmentExtended,
): Promise<void> {
  const deploymentResults: (DeploymentResult | undefined)[] = [];
  let simulationSuccess: boolean | undefined;

  const logDeploymentMsg = (contractName: string, result?: DeploymentResult, message?: string) => {
    const resultMsg = result
      ? result.address === result.type
        ? result.address
        : `${result.address} (${result.type})`
      : '';
    const customMsg = message ? `(${message})` : '';
    console.log(`${`      ${contractName}:`.padEnd(36, ' ')}${resultMsg}${customMsg}`);
  };

  const addToResult = (deployment?: DeploymentResult) => {
    if (deployment) {
      deploymentResults.push(deployment);
      logDeploymentMsg(deployment.contractName, deployment);
    }
  };

  try {
    simulationSuccess = args.simulate ? true : undefined;
    const [deployer] = await hre.ethers.getSigners();

    console.log(
      `*** Deploying with: ${deployer.address} on ${hre.network.name} (${
        hre.network.config.chainId
      }). Nonce = ${await deployer.getTransactionCount()} ***`,
    );

    // #region NATIVE TOKEN
    const nativeTokenNetwork = hre.network.name === 'private' ? 'mainnet' : hre.network.name;
    const nativeTokenHash = CurrencyManager.getDefault().getNativeCurrency(
      RequestLogicTypes.CURRENCY.ETH,
      nativeTokenNetwork,
    )?.hash;

    if (!nativeTokenHash) {
      throw new Error(`Could not guess native token hash for network ${hre.network.name}`);
    }
    // #endregion

    // #region UTILS

    // Utility to run a straight-forward deployment with deployOne()
    const runEasyDeployment = async <TContract extends Contract>(deployment: {
      contractName: string;
      constructorArguments?: string[];
      artifact: ContractArtifact<TContract>;
      nonceCondition?: number;
    }): Promise<DeploymentResult<TContract>> => {
      deployment.constructorArguments = deployment.constructorArguments ?? [];
      const result = await deployOne<TContract>(args, hre, deployment.contractName, {
        ...deployment,
      });
      addToResult(result);
      if (result.type === 'skipped') {
        switchToSimulation();
      }
      return result;
    };

    const switchToSimulation = () => {
      if (!args.simulate) {
        console.log('[!] Switching to simulated mode');
        args.simulate = true;
        simulationSuccess = simulationSuccess ?? true;
      }
    };
    // #endregion

    // #region BATCH DEFINITIONS
    /*
     * Batch 2
     *   - ERC20SwapToPay
     */
    const runDeploymentBatch_2 = async (erc20FeeProxyAddress: string) => {
      const nonceForBatch2 = 5;
      await jumpToNonce(args, hre, nonceForBatch2);

      // ERC20SwapToPay
      let swapRouterAddress = uniswapV2RouterAddresses[hre.network.name];
      if (!swapRouterAddress) {
        logDeploymentMsg(
          'ERC20SwapToPay:',
          undefined,
          'swap router missing - can be administrated by deployer',
        );
        swapRouterAddress = '0x0000000000000000000000000000000000000000';
      }
      const swapToPayResult = await deployOne(args, hre, 'ERC20SwapToPay', {
        constructorArguments: [swapRouterAddress, erc20FeeProxyAddress],
        artifact: erc20SwapToPayArtifact,
        nonceCondition: nonceForBatch2,
      });
      addToResult(swapToPayResult);
      return deploymentResults;
    };

    /*
     * Batch 4
     *   - ChainlinkConversionPath (+ addWhitelistAdmin())
     *   - ETHConversionProxy
     */
    const runDeploymentBatch_4 = async (ethFeeProxyAddress: string) => {
      const NONCE_BATCH_4 = 10;
      await jumpToNonce(args, hre, NONCE_BATCH_4);

      // Deploy ChainlinkConversionPath
      const {
        instance: chainlinkInstance,
        address: chainlinkConversionPathAddress,
      } = await runEasyDeployment({
        contractName: 'ChainlinkConversionPath',
        constructorArguments: [nativeTokenHash],
        artifact: chainlinkConversionPathArtifact,
        nonceCondition: NONCE_BATCH_4,
      });

      // Deploy ETH Conversion
      const ethConversionResult = await deployETHConversionProxy(
        {
          ...args,
          chainlinkConversionPathAddress,
          ethFeeProxyAddress,
          nonceCondition: NONCE_BATCH_4 + 1,
        },
        hre,
      );
      addToResult(ethConversionResult);

      // Administrate again whitelist admins for nonce consistency (due to 1 failing tx on Fantom)
      const chainlinkAdminNonce = NONCE_BATCH_4 + 2;
      const currentNonce = await deployer.getTransactionCount();
      if (currentNonce === chainlinkAdminNonce && chainlinkInstance) {
        if (!process.env.ADMIN_WALLET_ADDRESS) {
          throw new Error(
            'Chainlink was deployed but no ADMIN_WALLET_ADDRESS was provided, cannot addWhitelistAdmin.',
          );
        }
        if (args.simulate === false) {
          await chainlinkInstance.addWhitelistAdmin(process.env.ADMIN_WALLET_ADDRESS);
        } else {
          console.log('[i] Simulating addWhitelistAdmin to chainlinkInstance');
        }
      } else {
        if (currentNonce < chainlinkAdminNonce) {
          console.warn(`Warning: got nonce ${currentNonce} instead of ${chainlinkAdminNonce}`);
          switchToSimulation();
        } else if (!chainlinkInstance) {
          console.warn(`Warning: the Chainlink contract instance is not ready, consider retrying.`);
          switchToSimulation();
        }
      }
      return chainlinkInstance;
    };

    /*
     * Batch 5
     *   - 5.a ERC20ConversionProxy
     *   - 5.b ERC20ConversionProxy.transferOwnership
     *   - 5.c ERC20SwapConversion.setPaymentProxy
     */
    const runDeploymentBatch_5 = async (
      chainlinkInstance: ChainlinkConversionPath,
      erc20FeeProxyAddress: string,
      erc20SwapConversionInstance: ERC20SwapToConversion,
    ) => {
      const NONCE_BATCH_5 = 13;
      await jumpToNonce(args, hre, NONCE_BATCH_5);
      let chainlinkConversionPathAddress = chainlinkInstance?.address;
      if (!chainlinkConversionPathAddress) {
        switchToSimulation();
        chainlinkConversionPathAddress = 'simulated';
      }

      // 5.a ERC20ConversionProxy
      const erc20ConversionResult = await deployERC20ConversionProxy(
        {
          ...args,
          chainlinkConversionPathAddress,
          erc20FeeProxyAddress,
          nonceCondition: NONCE_BATCH_5,
        },
        hre,
      );
      addToResult(erc20ConversionResult);

      // 5.b ERC20ConversionProxy.transferOwnership

      let currentNonce = await deployer.getTransactionCount();
      const erc20ConversionAdminNonce = NONCE_BATCH_5 + 1;
      if (currentNonce === erc20ConversionAdminNonce && erc20ConversionResult) {
        if (!process.env.ADMIN_WALLET_ADDRESS) {
          throw new Error(
            'ADMIN_WALLET_ADDRESS missing for: ERC20ConversionProxy.transferOwnership',
          );
        }
        if (args.simulate === false) {
          await erc20ConversionResult.instance.transferOwnership(process.env.ADMIN_WALLET_ADDRESS);
        } else {
          console.log('[i] Simulating transferOwnership to ERC20ConversionProxy');
        }
      } else {
        if (currentNonce < erc20ConversionAdminNonce) {
          console.warn(
            `Warning: got nonce ${currentNonce} instead of ${erc20ConversionAdminNonce}`,
          );
          switchToSimulation();
        } else if (!erc20ConversionResult) {
          console.warn(
            `Warning: the ERC20ConversionProxy contract instance is not ready, consider retrying.`,
          );
          switchToSimulation();
        }
      }

      // 5.c ERC20SwapConversion.setPaymentProxy
      currentNonce = await deployer.getTransactionCount();
      const erc20SwapConversionAdminNonce = NONCE_BATCH_5 + 2;
      if (currentNonce === erc20SwapConversionAdminNonce && erc20ConversionResult) {
        if (args.simulate === false) {
          await erc20SwapConversionInstance.setPaymentProxy(erc20ConversionResult?.address);
        } else {
          console.log('[i] Simulating setPaymentProxy to ERC20SwapConversion');
        }
      } else {
        if (currentNonce < erc20SwapConversionAdminNonce) {
          console.warn(
            `Warning: got nonce ${currentNonce} instead of ${erc20SwapConversionAdminNonce}`,
          );
          switchToSimulation();
        } else if (!erc20ConversionResult) {
          console.warn(
            `Warning: the ERC20ConversionProxy contract instance is not ready for ERC20SwapConversion update, consider retrying.`,
          );
          switchToSimulation();
        }
      }
    };

    // #endregion

    // #region MAIN - Deployments

    // Batch 1
    await jumpToNonce(args, hre, 1);
    const { address: erc20FeeProxyAddress } = await runEasyDeployment({
      contractName: 'ERC20FeeProxy',
      artifact: erc20FeeProxyArtifact,
      nonceCondition: 1,
    });

    // Batch 2
    await runDeploymentBatch_2(erc20FeeProxyAddress);

    // Batch 3

    // SwapToConversion
    let swapRouterAddress = uniswapV2RouterAddresses[hre.network.name];
    if (!swapRouterAddress) {
      logDeploymentMsg(
        'ERC20SwapToConversion:',
        undefined,
        'swap and chainlinkPath set to 0x000..000 - can be administrated by deployer',
      );
      swapRouterAddress = '0x0000000000000000000000000000000000000000';
    }

    const swapConversionResult = await deploySwapConversion(
      {
        ...args,
        conversionProxyAddress: '0x0000000000000000000000000000000000000000',
        chainlinkConversionPathAddress: '0x0000000000000000000000000000000000000000',
        swapProxyAddress: swapRouterAddress,
        nonceCondition: 6,
      },
      hre,
    );
    addToResult(swapConversionResult);

    // Compute EthereumFeeProxy address (CREATE2)
    const ethFeeProxyAddress = await computeCreate2DeploymentAddress(
      { contract: 'EthereumFeeProxy' },
      hre,
    );

    // Batch 4
    const chainlinkInstance = await runDeploymentBatch_4(ethFeeProxyAddress);

    // Batch 5
    await runDeploymentBatch_5(
      chainlinkInstance,
      erc20FeeProxyAddress,
      swapConversionResult.instance,
    );

    // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Add future batches above this line
    console.log('Done deploying.');
    // #endregion
  } catch (e) {
    console.error(e);
  }

  // #region MAIN - Conclusion and verification

  console.log('Summary:');
  deploymentResults
    .filter((x): x is DeploymentResult => !!x)
    .forEach((res) => logDeploymentMsg(res.contractName, res));
  const nbDeployments = deploymentResults.filter((val) => val?.type === 'deployed').length;
  const verificationPromises = deploymentResults
    .map((val) => val?.verificationPromise)
    .filter(Boolean);

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
          return verificationPromise
            ? verificationPromise.then((success) => {
                nbSuccessfulVerifications += success ? 1 : 0;
                console.log(`${nbSuccessfulVerifications} / ${nbDeployments}...`);
              })
            : Promise.resolve();
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
  if (simulationSuccess === false) {
    console.log('--- DO NOT PROCEED ---');
  }
  // #endregion
}
