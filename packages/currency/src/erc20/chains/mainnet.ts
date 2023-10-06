import { TokenMap } from '../../types';


export const extraERC20Tokens = {
  // INDA
  '0x433d86336dB759855A66cCAbe4338313a8A7fc77': {
    name: 'Indacoin',
    symbol: 'INDA',
    decimals: 2,
  },
  // MPH
  '0x8888801aF4d980682e47f1A9036e589479e835C5': {
    name: '88mph.app',
    symbol: 'MPH',
    decimals: 18,
  },
  // OCEAN
  '0x967da4048cD07aB37855c090aAF366e4ce1b9F48': {
    name: 'Ocean Token',
    symbol: 'OCEAN',
    decimals: 18,
  },
  // ANKR
  '0x8290333ceF9e6D528dD5618Fb97a76f268f3EDD4': {
    name: 'Ankr Network',
    symbol: 'ANKR',
    decimals: 18,
  },
  // XSGD
  '0x70e8dE73cE538DA2bEEd35d14187F6959a8ecA96': {
    name: 'XSGD',
    symbol: 'XSGD',
    decimals: 6,
  },
  // OLY
  '0x6595b8fD9C920C81500dCa94e53Cdc712513Fb1f': {
    name: 'Olyseum',
    symbol: 'OLY',
    decimals: 18,
  },
  // AKRO
  '0x8Ab7404063Ec4DBcfd4598215992DC3F8EC853d7': {
    name: 'Akropolis',
    symbol: 'AKRO',
    decimals: 18,
  },
  // RLY
  '0xf1f955016EcbCd7321c7266BccFB96c68ea5E49b': {
    name: 'Rally',
    symbol: 'RLY',
    decimals: 18,
  },
  '0x7815bDa662050D84718B988735218CFfd32f75ea': {
    name: 'YEL Token',
    symbol: 'YEL',
    decimals: 18,
  },
};

// Merge metamask contracts list with our own
export const supportedMainnetERC20: TokenMap = {
  ...extraERC20Tokens,
};
