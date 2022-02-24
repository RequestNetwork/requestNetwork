import { Wallet, providers, BigNumber } from 'ethers';
import {
  ClientTypes,
  ExtensionTypes,
  IdentityTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import { encodeRequest } from '../../src';
import { currencyManager } from './shared';

/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/await-thenable */

const erc20ContractAddress = '0x9FBDa871d559710256a2502A2517b794B482Db40';
const feeAddress = '0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef';

// Cf. ERC20Alpha in TestERC20.sol
const alphaContractAddress = '0x38cF23C52Bb4B13F051Aec09580a2dE845a7FA35';
const alphaConversionSettings = {
  currency: {
    type: RequestLogicTypes.CURRENCY.ERC20,
    value: alphaContractAddress,
    network: 'private',
  },
  maxToSpend: BigNumber.from(2).pow(256).sub(1),
  currencyManager,
};
const ethConversionSettings = {
  currency: {
    type: RequestLogicTypes.CURRENCY.ETH,
    value: 'ETH',
  },
  maxToSpend: '2500000000000000',
  currencyManager,
};
const alphaSwapSettings = {
  deadline: 2599732187000, // This test will fail in 2052
  maxInputAmount: 204,
  path: [alphaContractAddress, erc20ContractAddress],
};
const alphaSwapConversionSettings = {
  deadline: 2599732187000, // This test will fail in 2052
  maxInputAmount: 204,
  path: [erc20ContractAddress, alphaContractAddress],
};

const mnemonic = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat';
const mnemonicPath = `m/44'/60'/0'/0/0`;
const paymentAddress = '0xf17f52151EbEF6C7334FAD080c5704D77216b732';
const provider = new providers.JsonRpcProvider('http://localhost:8545');
const wallet = Wallet.fromMnemonic(mnemonic, mnemonicPath).connect(provider);

const baseValidRequest: ClientTypes.IRequestData = {
  balance: {
    balance: '0',
    events: [],
  },
  contentData: {},
  creator: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: wallet.address,
  },
  currency: 'DAI',
  currencyInfo: {
    network: 'private',
    type: RequestLogicTypes.CURRENCY.ERC20,
    value: erc20ContractAddress,
  },

  events: [],
  expectedAmount: '100',
  extensions: {
    [PaymentTypes.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT]: {
      events: [],
      id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT,
      type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
      values: {
        paymentAddress,
        salt: 'salt',
      },
      version: '0.1.0',
    },
  },
  extensionsData: [],
  meta: {
    transactionManagerMeta: {},
  },
  pending: null,
  requestId: 'abcd',
  state: RequestLogicTypes.STATE.CREATED,
  timestamp: 0,
  version: '1.0',
};

const validRequestERC20FeeProxy: ClientTypes.IRequestData = {
  ...baseValidRequest,
  extensions: {
    [PaymentTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT]: {
      events: [],
      id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT,
      type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
      values: {
        feeAddress,
        feeAmount: '2',
        paymentAddress,
        salt: 'salt',
      },
      version: '0.1.0',
    },
  },
};

const validRequestERC20ConversionProxy: ClientTypes.IRequestData = {
  ...baseValidRequest,
  currency: 'EUR',
  currencyInfo: {
    type: RequestLogicTypes.CURRENCY.ISO4217,
    value: 'EUR',
  },
  extensions: {
    [PaymentTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY]: {
      events: [],
      id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ERC20_PROXY,
      type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
      values: {
        feeAddress,
        feeAmount: '2',
        paymentAddress,
        salt: 'salt',
        network: 'private',
        acceptedTokens: [alphaContractAddress],
      },
      version: '0.1.0',
    },
  },
};

const validRequestEthProxy: ClientTypes.IRequestData = {
  ...baseValidRequest,
  currency: 'ETH',
  currencyInfo: {
    network: 'private',
    type: RequestLogicTypes.CURRENCY.ETH,
    value: RequestLogicTypes.CURRENCY.ETH,
  },
  extensions: {
    [PaymentTypes.PAYMENT_NETWORK_ID.ETH_INPUT_DATA]: {
      events: [],
      id: ExtensionTypes.ID.PAYMENT_NETWORK_ETH_INPUT_DATA,
      type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
      values: {
        paymentAddress,
        salt: 'salt',
      },
      version: '0.1.0',
    },
  },
  version: '2.0.3',
};

const validRequestEthFeeProxy: ClientTypes.IRequestData = {
  ...baseValidRequest,
  currency: 'ETH',
  currencyInfo: {
    network: 'private',
    type: RequestLogicTypes.CURRENCY.ETH,
    value: RequestLogicTypes.CURRENCY.ETH,
  },
  extensions: {
    [PaymentTypes.PAYMENT_NETWORK_ID.ETH_FEE_PROXY_CONTRACT]: {
      events: [],
      id: ExtensionTypes.ID.PAYMENT_NETWORK_ETH_FEE_PROXY_CONTRACT,
      type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
      values: {
        feeAddress,
        feeAmount: '2',
        paymentAddress,
        salt: 'salt',
      },
      version: '0.1.0',
    },
  },
  version: '2.0.3',
};

const validRequestEthConversionProxy: ClientTypes.IRequestData = {
  ...baseValidRequest,
  currency: 'EUR',
  currencyInfo: {
    type: RequestLogicTypes.CURRENCY.ISO4217,
    value: 'EUR',
  },
  extensions: {
    [PaymentTypes.PAYMENT_NETWORK_ID.ANY_TO_ETH_PROXY]: {
      events: [],
      id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ETH_PROXY,
      type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
      values: {
        feeAddress,
        feeAmount: '2',
        paymentAddress,
        salt: 'salt',
        network: 'private',
      },
      version: '0.1.0',
    },
  },
};

describe('Encoder', () => {
  it('Should handle ERC20 Proxy request', async () => {
    const encodedTransactions = await encodeRequest(baseValidRequest, provider, wallet.address);

    let tx = await wallet.sendTransaction(encodedTransactions[0]);
    let confirmedTx = await tx.wait(1);
    expect(confirmedTx.status).toBe(1);
    expect(tx.hash).not.toBeUndefined();

    tx = await wallet.sendTransaction(encodedTransactions[1]);
    confirmedTx = await tx.wait(1);
    expect(confirmedTx.status).toBe(1);
    expect(tx.hash).not.toBeUndefined();
  });

  it('Should handle ERC20 Fee Proxy request', async () => {
    const encodedTransactions = await encodeRequest(
      validRequestERC20FeeProxy,
      provider,
      wallet.address,
    );

    let tx = await wallet.sendTransaction(encodedTransactions[0]);
    let confirmedTx = await tx.wait(1);
    expect(confirmedTx.status).toBe(1);
    expect(tx.hash).not.toBeUndefined();

    tx = await wallet.sendTransaction(encodedTransactions[1]);
    confirmedTx = await tx.wait(1);
    expect(confirmedTx.status).toBe(1);
    expect(tx.hash).not.toBeUndefined();
  });

  it('Should handle ERC20 Conversion Proxy request', async () => {
    let encodedTransactions = await encodeRequest(
      validRequestERC20ConversionProxy,
      provider,
      wallet.address,
      {
        conversion: alphaConversionSettings,
      },
    );

    let tx = await wallet.sendTransaction(encodedTransactions[0]);
    let confirmedTx = await tx.wait(1);
    expect(confirmedTx.status).toBe(1);
    expect(tx.hash).not.toBeUndefined();

    tx = await wallet.sendTransaction(encodedTransactions[1]);
    confirmedTx = await tx.wait(1);
    expect(confirmedTx.status).toBe(1);
    expect(tx.hash).not.toBeUndefined();
  });

  it('Should handle ERC20 Swap Proxy request', async () => {
    let encodedTransactions = await encodeRequest(
      validRequestERC20FeeProxy,
      provider,
      wallet.address,
      {
        swap: alphaSwapSettings,
      },
    );

    let tx = await wallet.sendTransaction(encodedTransactions[0]);
    let confirmedTx = await tx.wait(1);
    expect(confirmedTx.status).toBe(1);
    expect(tx.hash).not.toBeUndefined();

    tx = await wallet.sendTransaction(encodedTransactions[1]);
    confirmedTx = await tx.wait(1);
    expect(confirmedTx.status).toBe(1);
    expect(tx.hash).not.toBeUndefined();
  });

  it.only('Should handle ERC20 Swap and Conversion Proxy request', async () => {
    let encodedTransactions = await encodeRequest(
      validRequestERC20ConversionProxy,
      provider,
      wallet.address,
      {
        swap: alphaSwapConversionSettings,
        conversion: alphaConversionSettings,
      },
    );

    let tx = await wallet.sendTransaction(encodedTransactions[0]);
    let confirmedTx = await tx.wait(1);
    expect(confirmedTx.status).toBe(1);
    expect(tx.hash).not.toBeUndefined();

    tx = await wallet.sendTransaction(encodedTransactions[1]);
    confirmedTx = await tx.wait(1);
    expect(confirmedTx.status).toBe(1);
    expect(tx.hash).not.toBeUndefined();
  });

  it('Should handle Eth Proxy request', async () => {
    let encodedTransactions = await encodeRequest(validRequestEthProxy, provider, wallet.address);

    let tx = await wallet.sendTransaction(encodedTransactions[0]);
    let confirmedTx = await tx.wait(1);
    expect(confirmedTx.status).toBe(1);
    expect(tx.hash).not.toBeUndefined();
  });

  it('Should handle Eth Fee Proxy request', async () => {
    let encodedTransactions = await encodeRequest(
      validRequestEthFeeProxy,
      provider,
      wallet.address,
    );

    let tx = await wallet.sendTransaction(encodedTransactions[0]);
    let confirmedTx = await tx.wait(1);
    expect(confirmedTx.status).toBe(1);
    expect(tx.hash).not.toBeUndefined();
  });

  it('Should handle Eth Conversion Proxy', async () => {
    let encodedTransactions = await encodeRequest(
      validRequestEthConversionProxy,
      provider,
      wallet.address,
      {
        conversion: ethConversionSettings,
      },
    );

    let tx = await wallet.sendTransaction(encodedTransactions[0]);
    let confirmedTx = await tx.wait(1);
    expect(confirmedTx.status).toBe(1);
    expect(tx.hash).not.toBeUndefined();
  });
});
