import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { deployOne } from './deploy-one';

export async function deployERC20TransferableReceivable(
  args: any,
  hre: HardhatRuntimeEnvironment,
  mainPaymentAddresses: any,
) {
  try {
    // Deploy ERC20 Transferable Receivable
    const { address: ERC20TransferableReceivableAddress } = await deployOne(
      args,
      hre,
      'ERC20TransferableReceivable',
      {
        constructorArguments: [
          'Request Network Transferable Receivable',
          'tREC',
          mainPaymentAddresses.ERC20FeeProxyAddress,
        ],
        version: '0.2.0',
      },
    );

    console.log(
      `ERC20TransferableReceivable Contract deployed: ${ERC20TransferableReceivableAddress}`,
    );
  } catch (e) {
    console.error(e);
  }
}
