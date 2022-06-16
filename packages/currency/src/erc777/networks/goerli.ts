import { TokenMap } from '../../erc20/networks/types';

// List of the supported rinkeby ERC777 tokens
export const supportedGoerliERC777: TokenMap = {
  // Faucet Token on goerli network. Easy to use on tests.
  '0x2bf02814ea0b2b155ed47b7cede18caa752940e6': {
    decimals: 18,
    name: 'Super fDAI Fake Token',
    symbol: 'fDAIx',
  },
};
