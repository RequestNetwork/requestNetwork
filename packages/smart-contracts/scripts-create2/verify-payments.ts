import { verifyOne } from './verify-one';
import { HardhatRuntimeEnvironmentExtended } from './utils';
import { computeOne } from './compute-one-address';

const nullAddress = '0x0000000000000000000000000000000000000000';

// Verifies the contracts
export default async function VerifyPayments(
  hre: HardhatRuntimeEnvironmentExtended,
): Promise<void> {
  try {
    const signerAddress = new hre.ethers.Wallet(hre.config.xdeploy.signer).address;

    // Verify the contract ERC20Proxy
    const ERC20ProxyAddress = await computeOne({ contract: 'ERC20Proxy' }, hre);
    await verifyOne(ERC20ProxyAddress, { contract: 'ERC20Proxy' }, hre);

    // Verify the contract ERC20FeeProxy
    const ERC20FeeProxyAddress = await computeOne({ contract: 'ERC20FeeProxy' }, hre);
    await verifyOne(ERC20FeeProxyAddress, { contract: 'ERC20FeeProxy' }, hre);

    // Verify the contract EthProxy
    const EthProxyAddress = await computeOne({ contract: 'EthereumProxy' }, hre);
    await verifyOne(EthProxyAddress, { contract: 'EthereumProxy' }, hre);

    // Verify the contract EthFeeProxy
    const EthFeeProxyAddress = await computeOne({ contract: 'EthereumFeeProxy' }, hre);
    await verifyOne(EthFeeProxyAddress, { contract: 'EthereumFeeProxy' }, hre);

    // Verify the contract ChainlinkConversionPath
    const ChainlinkConversionPathAddress = await computeOne(
      { contract: 'ChainlinkConversionPath', constructorArgs: [signerAddress] },
      hre,
    );
    await verifyOne(
      ChainlinkConversionPathAddress,
      { contract: 'ChainlinkConversionPath', constructorArgs: [signerAddress] },
      hre,
    );

    // Verify the contract ERC20ConversionProxy
    const ERC20ConversionProxyAddress = await computeOne(
      {
        contract: 'Erc20ConversionProxy',
        constructorArgs: [ERC20FeeProxyAddress, nullAddress, signerAddress],
      },
      hre,
    );
    await verifyOne(
      ERC20ConversionProxyAddress,
      {
        contract: 'Erc20ConversionProxy',
        constructorArgs: [ERC20FeeProxyAddress, nullAddress, signerAddress],
      },
      hre,
    );

    // Verify the contract EthConversionProxy
    const EthConversionProxyAddress = await computeOne(
      {
        contract: 'EthConversionProxy',
        constructorArgs: [EthFeeProxyAddress, nullAddress, nullAddress, signerAddress],
      },
      hre,
    );
    await verifyOne(
      EthConversionProxyAddress,
      {
        contract: 'EthConversionProxy',
        constructorArgs: [EthFeeProxyAddress, nullAddress, nullAddress, signerAddress],
      },
      hre,
    );

    // Verify the contract ERC20SwapToPay
    const ERC20SwapToPayAddress = await computeOne(
      {
        contract: 'ERC20SwapToPay',
        constructorArgs: [nullAddress, ERC20FeeProxyAddress, signerAddress],
      },
      hre,
    );
    await verifyOne(
      ERC20SwapToPayAddress,
      {
        contract: 'ERC20SwapToPay',
        constructorArgs: [nullAddress, ERC20FeeProxyAddress, signerAddress],
      },
      hre,
    );

    // Verify the contract ERC20SwapToConversion
    const ERC20SwapToConversionAddress = await computeOne(
      {
        contract: 'ERC20SwapToConversion',
        constructorArgs: [nullAddress, ERC20ConversionProxyAddress, nullAddress, signerAddress],
      },
      hre,
    );
    await verifyOne(
      ERC20SwapToConversionAddress,
      {
        contract: 'ERC20SwapToConversion',
        constructorArgs: [nullAddress, ERC20ConversionProxyAddress, nullAddress, signerAddress],
      },
      hre,
    );
  } catch (e) {
    console.error(e);
  }
}
