import { HardhatRuntimeEnvironment } from 'hardhat/types';

/**
 * List of contract addresses with the same interface as Uniswap V2 Router.
 * Used for SwapToPay and SwapToConvert.
 */
export const uniswapV2RouterAddresses: Record<string, string> = {
  mainnet: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
  ropsten: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
  rinkeby: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
  goerli: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
  sepolia: '0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008',
  kovan: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
  private: '0x4E72770760c011647D4873f60A3CF6cDeA896CD8',
  bsctest: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
  bsc: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
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
  avalanche: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
  // No swap v2 found
  optimism: '0x0000000000000000000000000000000000000000',
  moonbeam: '0x0000000000000000000000000000000000000000',
  mantle: '0x0000000000000000000000000000000000000000',
  'mantle-testnet': '0x0000000000000000000000000000000000000000',
  core: '0x0000000000000000000000000000000000000000',
};

export const feeProxyAddresses: Record<
  string,
  { ethereumFeeProxyAddress: string; erc20FeeProxyAddress: string }
> = {
  mainnet: {
    ethereumFeeProxyAddress: '0xfCFBcfc4f5A421089e3Df45455F7f4985FE2D6a8',
    erc20FeeProxyAddress: '0x370DE27fdb7D1Ff1e1BaA7D11c5820a324Cf623C',
  },
  sepolia: {
    ethereumFeeProxyAddress: '0xe11BF2fDA23bF0A98365e1A4c04A87C9339e8687',
    erc20FeeProxyAddress: '0x399F5EE127ce7432E4921a61b8CF52b0af52cbfE',
  },
  optimism: {
    ethereumFeeProxyAddress: '0xe11BF2fDA23bF0A98365e1A4c04A87C9339e8687',
    erc20FeeProxyAddress: '0x399F5EE127ce7432E4921a61b8CF52b0af52cbfE',
  },
  'arbitrum-one': {
    ethereumFeeProxyAddress: '0xfCFBcfc4f5A421089e3Df45455F7f4985FE2D6a8',
    erc20FeeProxyAddress: '0x0DfbEe143b42B41eFC5A6F87bFD1fFC78c2f0aC9',
  },
  base: {
    ethereumFeeProxyAddress: '0xd9C3889eB8DA6ce449bfFE3cd194d08A436e96f2',
    erc20FeeProxyAddress: '0x1892196E80C4c17ea5100Da765Ab48c1fE2Fb814',
  },
  'zksync-era': {
    ethereumFeeProxyAddress: '0xE9A708db0D30409e39810C44cA240fd15cdA9b1a',
    erc20FeeProxyAddress: '0x6e28Cc56C2E64c9250f39Cb134686C87dB196532',
  },
  gnosis: {
    ethereumFeeProxyAddress: '0xfCFBcfc4f5A421089e3Df45455F7f4985FE2D6a8',
    erc20FeeProxyAddress: '0x0DfbEe143b42B41eFC5A6F87bFD1fFC78c2f0aC9',
  },
  polygon: {
    ethereumFeeProxyAddress: '0xfCFBcfc4f5A421089e3Df45455F7f4985FE2D6a8',
    erc20FeeProxyAddress: '0x0DfbEe143b42B41eFC5A6F87bFD1fFC78c2f0aC9',
  },
  bsc: {
    ethereumFeeProxyAddress: '0xfCFBcfc4f5A421089e3Df45455F7f4985FE2D6a8',
    erc20FeeProxyAddress: '0x0DfbEe143b42B41eFC5A6F87bFD1fFC78c2f0aC9',
  },
  celo: {
    ethereumFeeProxyAddress: '0xfCFBcfc4f5A421089e3Df45455F7f4985FE2D6a8',
    erc20FeeProxyAddress: '0x2171a0dc12a9E5b1659feF2BB20E54c84Fa7dB0C',
  },
  fantom: {
    ethereumFeeProxyAddress: '0xfCFBcfc4f5A421089e3Df45455F7f4985FE2D6a8',
    erc20FeeProxyAddress: '0x0DfbEe143b42B41eFC5A6F87bFD1fFC78c2f0aC9',
  },
  core: {
    ethereumFeeProxyAddress: '0xe11BF2fDA23bF0A98365e1A4c04A87C9339e8687',
    erc20FeeProxyAddress: '0x399F5EE127ce7432E4921a61b8CF52b0af52cbfE',
  },
  avalanche: {
    ethereumFeeProxyAddress: '0xfCFBcfc4f5A421089e3Df45455F7f4985FE2D6a8',
    erc20FeeProxyAddress: '0x0DfbEe143b42B41eFC5A6F87bFD1fFC78c2f0aC9',
  },
  fuse: {
    ethereumFeeProxyAddress: '0xfCFBcfc4f5A421089e3Df45455F7f4985FE2D6a8',
    erc20FeeProxyAddress: '0xee07ef5B414955188d2A9fF50bdCE784A49031Fc',
  },
  moonbeam: {
    ethereumFeeProxyAddress: '0xe11BF2fDA23bF0A98365e1A4c04A87C9339e8687',
    erc20FeeProxyAddress: '0x399F5EE127ce7432E4921a61b8CF52b0af52cbfE',
  },
  ronin: {
    ethereumFeeProxyAddress: '0xe9cbD1Aa5496628F4302426693Ad63006C56959F',
    erc20FeeProxyAddress: '0xAe23992483FeDA6E718a808Ce824f6864F13B64B',
  },
  mantle: {
    ethereumFeeProxyAddress: '0xe11BF2fDA23bF0A98365e1A4c04A87C9339e8687',
    erc20FeeProxyAddress: '0x399F5EE127ce7432E4921a61b8CF52b0af52cbfE',
  },
};

/**
 * Executes as many empty transactions as needed for the nonce goes up to a certain target.
 * Assuming that the deployer is the first signer.
 */
export const jumpToNonce = async (args: any, hre: HardhatRuntimeEnvironment, nonce: number) => {
  const [deployer] = await hre.ethers.getSigners();
  let nextNonce = await deployer.getTransactionCount();
  if (args.simulate) {
    if (nextNonce < nonce) {
      console.log(`Simulating a jump to nonce ${nonce} (current: ${nextNonce})`);
    }
    return;
  }
  while (nextNonce < nonce) {
    // Atificially increase nonce if needed
    const tx = await deployer.sendTransaction({ to: deployer.address, nonce: nextNonce });
    await tx.wait(1);
    nextNonce = await deployer.getTransactionCount();
  }
};

/** Variable used to count the number of contracts deployed at the wrong address */
export let NUMBER_ERRORS = 0;

/**
 * The function compare the address of the contract deployed with the existing one, usually stored in artifacts
 * @param contratName name of the contract used to deployed an instance, or name of the instance if they are many implementations
 * @param contractAddress address of the current deployement
 * @param contractAddressExpected usually stored in artifacts
 */
export const deployAddressChecking = (
  contratName: string,
  contractAddress: string,
  contractAddressExpected: string,
): void => {
  if (contractAddress !== contractAddressExpected) {
    NUMBER_ERRORS += 1;
    const msg = `${contratName} deployed at ${contractAddress} is different from the one expected: ${contractAddressExpected}, please update your code or the artifact`;
    throw Error(msg);
  }
};
