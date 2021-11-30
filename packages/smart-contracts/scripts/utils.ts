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
};
