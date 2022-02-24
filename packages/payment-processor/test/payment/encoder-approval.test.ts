import { Wallet, providers, BigNumber } from 'ethers';
import {
  ClientTypes,
  ExtensionTypes,
  IdentityTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import { encodeRequestErc20ApprovalIfNeeded } from '../../src';
import { getProxyAddress } from '../../src/payment/utils';
import { AnyToERC20PaymentDetector, Erc20PaymentNetwork } from '@requestnetwork/payment-detection';
import { currencyManager } from './shared';
import { IPreparedTransaction } from 'payment-processor/dist/payment/prepared-transaction';
import {
  erc20SwapToPayArtifact,
  erc20SwapConversionArtifact,
} from '@requestnetwork/smart-contracts';

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
const mnemonicPath = `m/44'/60'/0'/0/3`;
const paymentAddress = '0x821aEa9a577a9b44299B9c15c88cf3087F3b5544';
const provider = new providers.JsonRpcProvider('http://localhost:8545');
const wallet = Wallet.fromMnemonic(mnemonic, mnemonicPath).connect(provider);
const erc20ApprovalData = (proxy: string) => {
  return `0x095ea7b3000000000000000000000000${proxy
    .slice(2)
    .toLowerCase()}ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff`;
};

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
        tokensAccepted: [alphaContractAddress],
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

describe('Approval encoder handles ERC20 Proxy', () => {
  it('Should return a valid transaction', async () => {
    const approvalTransaction = await encodeRequestErc20ApprovalIfNeeded(
      baseValidRequest,
      provider,
      wallet.address,
    );

    const proxyAddress = getProxyAddress(
      baseValidRequest,
      Erc20PaymentNetwork.ERC20ProxyPaymentDetector.getDeploymentInformation,
    );

    expect(approvalTransaction).toEqual({
      data: erc20ApprovalData(proxyAddress),
      to: erc20ContractAddress,
      value: 0,
    });
  });

  it('Should not return anything', async () => {
    let approvalTransaction = await encodeRequestErc20ApprovalIfNeeded(
      baseValidRequest,
      provider,
      wallet.address,
    );
    await wallet.sendTransaction(approvalTransaction as IPreparedTransaction);

    approvalTransaction = await encodeRequestErc20ApprovalIfNeeded(
      baseValidRequest,
      provider,
      wallet.address,
    );
    expect(approvalTransaction).toBeUndefined();
  });
});

describe('Approval encoder handles ERC20 Fee Proxy', () => {
  it('Should return a valid transaction', async () => {
    const approvalTransaction = await encodeRequestErc20ApprovalIfNeeded(
      validRequestERC20FeeProxy,
      provider,
      wallet.address,
    );

    const proxyAddress = getProxyAddress(
      validRequestERC20FeeProxy,
      Erc20PaymentNetwork.ERC20FeeProxyPaymentDetector.getDeploymentInformation,
    );

    expect(approvalTransaction).toEqual({
      data: erc20ApprovalData(proxyAddress),
      to: erc20ContractAddress,
      value: 0,
    });
  });
  it('Should not return anything', async () => {
    let approvalTransaction = await encodeRequestErc20ApprovalIfNeeded(
      validRequestERC20FeeProxy,
      provider,
      wallet.address,
    );
    await wallet.sendTransaction(approvalTransaction as IPreparedTransaction);

    approvalTransaction = await encodeRequestErc20ApprovalIfNeeded(
      validRequestERC20FeeProxy,
      provider,
      wallet.address,
    );
    expect(approvalTransaction).toBeUndefined();
  });
});

describe('Approval encoder handles ERC20 Conversion Proxy', () => {
  it('Should return a valid transaction', async () => {
    let approvalTransaction = await encodeRequestErc20ApprovalIfNeeded(
      validRequestERC20ConversionProxy,
      provider,
      wallet.address,
      {
        conversion: alphaConversionSettings,
      },
    );

    const proxyAddress = getProxyAddress(
      validRequestERC20ConversionProxy,
      AnyToERC20PaymentDetector.getDeploymentInformation,
    );

    expect(approvalTransaction).toEqual({
      data: erc20ApprovalData(proxyAddress),
      to: alphaContractAddress,
      value: 0,
    });
  });

  it('Should not return anything', async () => {
    let approvalTransaction = await encodeRequestErc20ApprovalIfNeeded(
      validRequestERC20ConversionProxy,
      provider,
      wallet.address,
      {
        conversion: alphaConversionSettings,
      },
    );
    await wallet.sendTransaction(approvalTransaction as IPreparedTransaction);

    approvalTransaction = await encodeRequestErc20ApprovalIfNeeded(
      validRequestERC20ConversionProxy,
      provider,
      wallet.address,
      {
        conversion: alphaConversionSettings,
      },
    );
    expect(approvalTransaction).toBeUndefined();
  });

  it('Should not be possible to encode a conversion transaction without passing options', async () => {
    await expect(
      encodeRequestErc20ApprovalIfNeeded(
        validRequestERC20ConversionProxy,
        provider,
        wallet.address,
      ),
    ).rejects.toThrowError('Conversion settings missing');
  });
});

describe('Approval encoder handles ERC20 Swap Proxy', () => {
  it('Should return a valid transaction', async () => {
    let approvalTransaction = await encodeRequestErc20ApprovalIfNeeded(
      validRequestERC20FeeProxy,
      provider,
      wallet.address,
      {
        swap: alphaSwapSettings,
      },
    );

    const proxyAddress = erc20SwapToPayArtifact.getAddress(
      validRequestERC20FeeProxy.currencyInfo.network!,
    );

    expect(approvalTransaction).toEqual({
      data: erc20ApprovalData(proxyAddress),
      to: alphaContractAddress,
      value: 0,
    });
  });

  it('Should not return anything', async () => {
    let approvalTransaction = await encodeRequestErc20ApprovalIfNeeded(
      validRequestERC20FeeProxy,
      provider,
      wallet.address,
      {
        swap: alphaSwapSettings,
      },
    );
    await wallet.sendTransaction(approvalTransaction as IPreparedTransaction);

    approvalTransaction = await encodeRequestErc20ApprovalIfNeeded(
      validRequestERC20FeeProxy,
      provider,
      wallet.address,
      {
        swap: alphaSwapSettings,
      },
    );
    expect(approvalTransaction).toBeUndefined();
  });
});

describe('Approval encoder handles ERC20 Swap & Conversion Proxy', () => {
  it('Should return a valid transaction', async () => {
    let approvalTransaction = await encodeRequestErc20ApprovalIfNeeded(
      validRequestERC20ConversionProxy,
      provider,
      wallet.address,
      {
        swap: alphaSwapConversionSettings,
        conversion: alphaConversionSettings,
      },
    );

    const proxyAddress = erc20SwapConversionArtifact.getAddress(
      validRequestERC20FeeProxy.currencyInfo.network!,
    );

    expect(approvalTransaction).toEqual({
      data: erc20ApprovalData(proxyAddress),
      to: alphaContractAddress,
      value: 0,
    });
  });

  it('Should not return anything', async () => {
    let approvalTransaction = await encodeRequestErc20ApprovalIfNeeded(
      validRequestERC20ConversionProxy,
      provider,
      wallet.address,
      {
        swap: alphaSwapSettings,
        conversion: alphaConversionSettings,
      },
    );
    await wallet.sendTransaction(approvalTransaction as IPreparedTransaction);

    approvalTransaction = await encodeRequestErc20ApprovalIfNeeded(
      validRequestERC20ConversionProxy,
      provider,
      wallet.address,
      {
        swap: alphaSwapSettings,
        conversion: alphaConversionSettings,
      },
    );
    expect(approvalTransaction).toBeUndefined();
  });

  it('Should not be possible to encode a conversion transaction without passing options', async () => {
    await expect(
      encodeRequestErc20ApprovalIfNeeded(
        validRequestERC20ConversionProxy,
        provider,
        wallet.address,
      ),
    ).rejects.toThrowError();
  });

  it('Should not be possible to encode a conversion transaction without passing conversion options', async () => {
    await expect(
      encodeRequestErc20ApprovalIfNeeded(
        validRequestERC20ConversionProxy,
        provider,
        wallet.address,
        {
          swap: alphaSwapSettings,
        },
      ),
    ).rejects.toThrowError();
  });
});

describe('Approval encoder handles Eth Requests', () => {
  it('Should not return anything for Eth Proxy', async () => {
    let approvalTransaction = await encodeRequestErc20ApprovalIfNeeded(
      validRequestEthProxy,
      provider,
      wallet.address,
    );
    expect(approvalTransaction).toBeUndefined();
  });
  it('Should not return anything for Eth Fee Proxy', async () => {
    let approvalTransaction = await encodeRequestErc20ApprovalIfNeeded(
      validRequestEthFeeProxy,
      provider,
      wallet.address,
    );
    expect(approvalTransaction).toBeUndefined();
  });
  it('Should not return anything for Eth Conversion Proxy', async () => {
    let approvalTransaction = await encodeRequestErc20ApprovalIfNeeded(
      validRequestEthConversionProxy,
      provider,
      wallet.address,
    );
    expect(approvalTransaction).toBeUndefined();
  });
});
