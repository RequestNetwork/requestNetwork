import { HardhatRuntimeEnvironment } from 'hardhat/types';

/**
 * List of contract addresses with the same interface as Uniswap V2 Router.
 * Used for SwapToPay and SwapToConvert.
 */
export const uniswapV2RouterAddresses: Record<string, string> = {
  mainnet: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
  ropsten: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
  rinkeby: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
  kovan: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
  private: '0x4E72770760c011647D4873f60A3CF6cDeA896CD8',
  bsctest: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
  xdai: '0x1C232F01118CB8B424793ae03F870aa7D0ac7f77',
  // https://layer3.gitbook.io/spirit-swap/contracts
  fantom: '0x16327e3fbdaca3bcf7e38f5af2599d2ddc33ae52',
  // https://github.com/QuickSwap/quickswap-core
  matic: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff',
  // https://app.ubeswap.org/#/swap
  celo: '0x7D28570135A2B1930F331c507F65039D4937f66c',
  // No swap v2 found
  'arbitrum-rinkeby': '0x0000000000000000000000000000000000000000',
  'arbitrum-one': '0x0000000000000000000000000000000000000000',
};

/**
 * Executes as many empty transactions as needed for the nonce goes up to a certain target.
 * Assuming that the deployer is the first signer.
 */
export const jumpToNonce = async (args: any, hre: HardhatRuntimeEnvironment, nonce: number) => {
  const [deployer] = await hre.ethers.getSigners();
  if (args.simulate) {
    const currentNonce = await deployer.getTransactionCount();
    if (currentNonce < nonce) {
      console.log(`Simulating a jump to nonce ${nonce} (current: ${currentNonce})`);
    }
    return;
  }
  while ((await deployer.getTransactionCount()) < nonce) {
    // Atificially increase nonce if needed
    await deployer.sendTransaction({ to: deployer.address });
  }
};
