import { Wallet, providers, BigNumber } from 'ethers';
import {
  ClientTypes,
  ExtensionTypes,
  IdentityTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import { encodeRequestPayment, encodeRequestPaymentWithStream } from '../../src';
import { getProxyAddress, MAX_ALLOWANCE } from '../../src/payment/utils';
import {
  AnyToERC20PaymentDetector,
  AnyToEthFeeProxyPaymentDetector,
  Erc20PaymentNetwork,
  EthFeeProxyPaymentDetector,
  EthInputDataPaymentDetector,
} from '@requestnetwork/payment-detection';
import { currencyManager } from './shared';
import {
  erc20SwapToPayArtifact,
  erc20SwapConversionArtifact,
} from '@requestnetwork/smart-contracts';
import { DAIX_ADDRESS } from './erc777-stream.test';

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
  maxInputAmount: 204,
  path: [erc20ContractAddress, alphaContractAddress],
};

const mnemonic = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat';
const paymentAddress = '0xf17f52151EbEF6C7334FAD080c5704D77216b732';
const expectedFlowRate = '100000';
const expectedStartDate = '1643041225';
const provider = new providers.JsonRpcProvider('http://localhost:8545');
const wallet = Wallet.fromMnemonic(mnemonic).connect(provider);

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
    [PaymentTypes.PNShortcuts.ERC20_PROXY_CONTRACT]: {
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
    [PaymentTypes.PNShortcuts.ERC20_FEE_PROXY_CONTRACT]: {
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

const validRequestERC777Stream: ClientTypes.IRequestData = {
  ...baseValidRequest,
  currency: 'DAIx',
  currencyInfo: {
    network: 'private',
    type: RequestLogicTypes.CURRENCY.ERC777,
    value: DAIX_ADDRESS,
  },
  extensions: {
    [PaymentTypes.PNShortcuts.ERC777_STREAM]: {
      events: [],
      id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC777_STREAM,
      type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
      values: {
        expectedStartDate,
        expectedFlowRate,
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
    [PaymentTypes.PNShortcuts.ANY_TO_ERC20_PROXY]: {
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
    [PaymentTypes.PNShortcuts.ETH_INPUT_DATA]: {
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
    [PaymentTypes.PNShortcuts.ETH_FEE_PROXY_CONTRACT]: {
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
    [PaymentTypes.PNShortcuts.ANY_TO_ETH_PROXY]: {
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

describe('Payment encoder handles ERC20 Proxy', () => {
  it('Should return a valid transaction', async () => {
    const paymentTransaction = encodeRequestPayment(baseValidRequest, provider);

    const proxyAddress = getProxyAddress(
      baseValidRequest,
      Erc20PaymentNetwork.ERC20ProxyPaymentDetector.getDeploymentInformation,
    );

    expect(paymentTransaction).toEqual({
      data: '0x0784bca30000000000000000000000009fbda871d559710256a2502a2517b794b482db40000000000000000000000000f17f52151ebef6c7334fad080c5704d77216b73200000000000000000000000000000000000000000000000000000000000000640000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000886dfbccad783599a000000000000000000000000000000000000000000000000',
      to: proxyAddress,
      value: 0,
    });
  });
});

describe('Payment encoder handles ERC20 Fee Proxy', () => {
  it('Should return a valid transaction', async () => {
    const paymentTransaction = encodeRequestPayment(validRequestERC20FeeProxy, provider);

    const proxyAddress = getProxyAddress(
      validRequestERC20FeeProxy,
      Erc20PaymentNetwork.ERC20FeeProxyPaymentDetector.getDeploymentInformation,
    );

    expect(paymentTransaction).toEqual({
      data: '0xc219a14d0000000000000000000000009fbda871d559710256a2502a2517b794b482db40000000000000000000000000f17f52151ebef6c7334fad080c5704d77216b732000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000002000000000000000000000000c5fdf4076b8f3a5357c5e395ab970b5b54098fef000000000000000000000000000000000000000000000000000000000000000886dfbccad783599a000000000000000000000000000000000000000000000000',
      to: proxyAddress,
      value: 0,
    });
  });
});

describe('Payment encoder handles ERC20 Conversion Proxy', () => {
  it('Should return a valid transaction', async () => {
    let paymentTransaction = encodeRequestPayment(validRequestERC20ConversionProxy, provider, {
      conversion: alphaConversionSettings,
    });

    const proxyAddress = getProxyAddress(
      validRequestERC20ConversionProxy,
      AnyToERC20PaymentDetector.getDeploymentInformation,
    );

    expect(paymentTransaction).toEqual({
      data: '0x3af2c012000000000000000000000000f17f52151ebef6c7334fad080c5704d77216b7320000000000000000000000000000000000000000000000000000000005f5e1000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000018000000000000000000000000000000000000000000000000000000000001e8480000000000000000000000000c5fdf4076b8f3a5357c5e395ab970b5b54098fefffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000300000000000000000000000017b4158805772ced11225e77339f90beb5aae968000000000000000000000000775eb53d00dd0acd3ec1696472105d579b9b386b00000000000000000000000038cf23c52bb4b13f051aec09580a2de845a7fa35000000000000000000000000000000000000000000000000000000000000000886dfbccad783599a000000000000000000000000000000000000000000000000',
      to: proxyAddress,
      value: 0,
    });
  });
  it('Should not be possible to encode a conversion transaction without passing options', async () => {
    expect(() => encodeRequestPayment(validRequestERC20ConversionProxy, provider)).toThrowError(
      'Conversion settings missing',
    );
  });
});

describe('Payment encoder handles ERC20 Swap Proxy', () => {
  it('Should return a valid transaction', async () => {
    let paymentTransaction = encodeRequestPayment(validRequestERC20FeeProxy, provider, {
      swap: alphaSwapSettings,
    });

    const proxyAddress = erc20SwapToPayArtifact.getAddress(
      validRequestERC20FeeProxy.currencyInfo.network!,
    );

    expect(paymentTransaction).toEqual({
      data: '0x8d09fe2b000000000000000000000000f17f52151ebef6c7334fad080c5704d77216b732000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000000000cc000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001600000000000000000000000000000000000000000000000000000000000000002000000000000000000000000c5fdf4076b8f3a5357c5e395ab970b5b54098fef000000000000000000000000000000000000000000000000000000009af4c3db000000000000000000000000000000000000000000000000000000000000000200000000000000000000000038cf23c52bb4b13f051aec09580a2de845a7fa350000000000000000000000009fbda871d559710256a2502a2517b794b482db40000000000000000000000000000000000000000000000000000000000000000886dfbccad783599a000000000000000000000000000000000000000000000000',
      to: proxyAddress,
      value: 0,
    });
  });
});

describe('Payment encoder handles ERC20 Swap & Conversion Proxy', () => {
  it('Should return a valid transaction', async () => {
    let paymentTransaction = encodeRequestPayment(validRequestERC20ConversionProxy, provider, {
      swap: alphaSwapConversionSettings,
      conversion: alphaConversionSettings,
    });

    const proxyAddress = erc20SwapConversionArtifact.getAddress(
      alphaConversionSettings.currency.network,
    );

    expect(paymentTransaction).toEqual({
      data: '0xad6d6106000000000000000000000000de5491f774f0cb009abcea7326342e105dbb1b2e000000000000000000000000f17f52151ebef6c7334fad080c5704d77216b7320000000000000000000000000000000000000000000000000000000005f5e10000000000000000000000000000000000000000000000000000000000000000cc000000000000000000000000000000000000000000000000000000000000016000000000000000000000000000000000000000000000000000000000000001c0000000000000000000000000000000000000000000000000000000000000024000000000000000000000000000000000000000000000000000000000001e8480000000000000000000000000c5fdf4076b8f3a5357c5e395ab970b5b54098fef000000000000000000000000000000000000000000000000000000009af4c3db000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020000000000000000000000009fbda871d559710256a2502a2517b794b482db4000000000000000000000000038cf23c52bb4b13f051aec09580a2de845a7fa35000000000000000000000000000000000000000000000000000000000000000300000000000000000000000017b4158805772ced11225e77339f90beb5aae968000000000000000000000000775eb53d00dd0acd3ec1696472105d579b9b386b00000000000000000000000038cf23c52bb4b13f051aec09580a2de845a7fa35000000000000000000000000000000000000000000000000000000000000000886dfbccad783599a000000000000000000000000000000000000000000000000',
      to: proxyAddress,
      value: 0,
    });
  });

  it('Should not be possible to encode a conversion transaction without passing options', () => {
    expect(() => encodeRequestPayment(validRequestERC20ConversionProxy, provider)).toThrowError(
      'Conversion settings missing',
    );
  });

  it('Should not be possible to encode a conversion transaction without passing conversion options', () => {
    expect(() =>
      encodeRequestPayment(validRequestERC20ConversionProxy, provider, {
        swap: alphaSwapSettings,
      }),
    ).toThrowError('Conversion settings missing');
  });
});

describe('Payment encoder handles Eth Proxy', () => {
  it('Should return a valid transaction', async () => {
    let paymentTransaction = encodeRequestPayment(validRequestEthProxy, provider);

    const proxyAddress = getProxyAddress(
      validRequestEthProxy,
      EthInputDataPaymentDetector.getDeploymentInformation,
    );

    expect(paymentTransaction).toEqual({
      data: '0xeb7d8df3000000000000000000000000f17f52151ebef6c7334fad080c5704d77216b7320000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000886dfbccad783599a000000000000000000000000000000000000000000000000',
      to: proxyAddress,
      value: BigNumber.from(validRequestEthProxy.expectedAmount),
    });
  });
});

describe('Payment encoder handles Eth Fee Proxy', () => {
  it('Should return a valid transaction', async () => {
    let paymentTransaction = encodeRequestPayment(validRequestEthFeeProxy, provider);

    const proxyAddress = getProxyAddress(
      validRequestEthFeeProxy,
      EthFeeProxyPaymentDetector.getDeploymentInformation,
    );

    expect(paymentTransaction).toEqual({
      data: '0xb868980b000000000000000000000000f17f52151ebef6c7334fad080c5704d77216b73200000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000002000000000000000000000000c5fdf4076b8f3a5357c5e395ab970b5b54098fef000000000000000000000000000000000000000000000000000000000000000886dfbccad783599a000000000000000000000000000000000000000000000000',
      to: proxyAddress,
      value: BigNumber.from(validRequestERC20FeeProxy.expectedAmount).add(2),
    });
  });
});

describe('Payment encoder handles Eth Conversion Proxy', () => {
  it('Should return a valid transaction', async () => {
    let paymentTransaction = encodeRequestPayment(validRequestEthConversionProxy, provider, {
      conversion: ethConversionSettings,
    });

    const proxyAddress = getProxyAddress(
      validRequestEthConversionProxy,
      AnyToEthFeeProxyPaymentDetector.getDeploymentInformation,
    );

    expect(paymentTransaction).toEqual({
      data: '0xac473c8a000000000000000000000000f17f52151ebef6c7334fad080c5704d77216b7320000000000000000000000000000000000000000000000000000000005f5e10000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000016000000000000000000000000000000000000000000000000000000000001e8480000000000000000000000000c5fdf4076b8f3a5357c5e395ab970b5b54098fef0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000300000000000000000000000017b4158805772ced11225e77339f90beb5aae968000000000000000000000000775eb53d00dd0acd3ec1696472105d579b9b386b000000000000000000000000f5af88e117747e87fc5929f2ff87221b1447652e000000000000000000000000000000000000000000000000000000000000000886dfbccad783599a000000000000000000000000000000000000000000000000',
      to: proxyAddress,
      value: BigNumber.from(ethConversionSettings.maxToSpend),
    });
  });
  it('Should not be possible to encode a conversion transaction without passing conversion options', () => {
    expect(() => encodeRequestPayment(validRequestEthConversionProxy, provider)).toThrowError(
      'Conversion settings missing',
    );
  });
});

describe('Payment encoder handles ERC777 Stream', () => {
  it('Should return a valid transaction', async () => {
    const paymentTransaction = await encodeRequestPaymentWithStream(
      validRequestERC777Stream,
      provider,
    );

    expect(paymentTransaction).toEqual({
      data: '0x6ad3ca7d00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000c90000000000000000000000000dd64f3458f32a277ccd94bfbdb31952b84d99ee000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000001600000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000000000000000a462fc305e0000000000000000000000007d782d2cc2755ca324de57d42e28cc63278dfe12000000000000000000000000f17f52151ebef6c7334fad080c5704d77216b73200000000000000000000000000000000000000000000000000000000000186a00000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000bbeefac86dfbccad783599a000000000000000000000000000000000000000000',
      to: '0x75076e4fbba61f65efB41D64e45cFF340b1e518A',
      value: 0,
    });
  });
});
