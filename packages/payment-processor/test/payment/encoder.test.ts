import { Wallet, providers, BigNumber } from 'ethers';
import {
  ClientTypes,
  ExtensionTypes,
  IdentityTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import { encodeRequestApprovalAndPayment } from '../../src';
import { currencyManager } from './shared';
import { ERC20__factory } from '@requestnetwork/smart-contracts/types';
import { MAX_ALLOWANCE } from 'payment-processor/src/payment/utils';

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
  maxToSpend: MAX_ALLOWANCE,
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
  maxInputAmount: '100000000000000000000',
  path: [erc20ContractAddress, alphaContractAddress],
};

const mnemonic = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat';
const mnemonicPath = `m/44'/60'/0'/0/20`;
const paymentAddress = '0xf17f52151EbEF6C7334FAD080c5704D77216b732';
const provider = new providers.JsonRpcProvider('http://localhost:8545');
let wallet = Wallet.fromMnemonic(mnemonic, mnemonicPath).connect(provider);

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

beforeAll(async () => {
  const mainAddress = wallet.address;
  wallet = Wallet.fromMnemonic(mnemonic).connect(provider);
  const alphaContract = ERC20__factory.connect(alphaContractAddress, wallet);
  await alphaContract.transfer(mainAddress, BigNumber.from('500000000000000000000'));
  const erc20Contract = ERC20__factory.connect(erc20ContractAddress, wallet);
  await erc20Contract.transfer(mainAddress, BigNumber.from('500000000000000000000'));
  wallet.sendTransaction({
    to: mainAddress,
    value: BigNumber.from('10000000000000000000'),
  });
  wallet = Wallet.fromMnemonic(mnemonic, mnemonicPath).connect(provider);
});

describe('Encoder', () => {
  it('Should handle ERC20 Proxy request', async () => {
    const encodedTransactions = await encodeRequestApprovalAndPayment(baseValidRequest, provider);

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
    const encodedTransactions = await encodeRequestApprovalAndPayment(
      validRequestERC20FeeProxy,
      provider,
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
    let encodedTransactions = await encodeRequestApprovalAndPayment(
      validRequestERC20ConversionProxy,
      provider,
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
    let encodedTransactions = await encodeRequestApprovalAndPayment(
      validRequestERC20FeeProxy,
      provider,
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

  it('Should handle ERC20 Swap and Conversion Proxy request', async () => {
    let encodedTransactions = await encodeRequestApprovalAndPayment(
      validRequestERC20ConversionProxy,
      provider,
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
    let encodedTransactions = await encodeRequestApprovalAndPayment(validRequestEthProxy, provider);

    let tx = await wallet.sendTransaction(encodedTransactions[0]);
    let confirmedTx = await tx.wait(1);
    expect(confirmedTx.status).toBe(1);
    expect(tx.hash).not.toBeUndefined();
  });

  it('Should handle Eth Fee Proxy request', async () => {
    let encodedTransactions = await encodeRequestApprovalAndPayment(
      validRequestEthFeeProxy,
      provider,
    );

    let tx = await wallet.sendTransaction(encodedTransactions[0]);
    let confirmedTx = await tx.wait(1);
    expect(confirmedTx.status).toBe(1);
    expect(tx.hash).not.toBeUndefined();
  });

  it('Should handle Eth Conversion Proxy', async () => {
    let encodedTransactions = await encodeRequestApprovalAndPayment(
      validRequestEthConversionProxy,
      provider,
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
