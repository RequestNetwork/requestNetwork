import {
  ExtensionTypes,
  IdentityTypes,
  RequestLogicTypes,
  SignatureTypes,
} from '@requestnetwork/types';
import { ICurrency } from '@requestnetwork/types/dist/request-logic-types';
import { IValues, ICreationParameters } from '@requestnetwork/types/src/extensions/pc-exchange-rate';

// payee id
export const payeeRaw = {
  address: '0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce',
  identity: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: '0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce',
  },
  privateKey: '0x04674d2e53e0e14653487d7323cc5f0a7959c83067f5654cafe4094bde90fa8a',
  publicKey:
    '299708c07399c9b28e9870c4e643742f65c94683f35d1b3fc05d0478344ee0cc5a6a5e23f78b5ff8c93a04254232b32350c8672d2873677060d5095184dad422',
  signatureParams: {
    method: SignatureTypes.METHOD.ECDSA,
    privateKey: '0x04674d2e53e0e14653487d7323cc5f0a7959c83067f5654cafe4094bde90fa8a',
  },
};

// payer id
export const payerRaw = {
  address: '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6',
  identity: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6',
  },
  privateKey: '0x0906ff14227cead2b25811514302d57706e7d5013fcc40eca5985b216baeb998',
  publicKey:
    '9008306d319755055226827c22f4b95552c799bae7af0e99780cf1b5500d9d1ecbdbcf6f27cdecc72c97fef3703c54b717bca613894212e0b2525cbb2d1161b9',
  signatureParams: {
    method: SignatureTypes.METHOD.ECDSA,
    privateKey: '0x0906ff14227cead2b25811514302d57706e7d5013fcc40eca5985b216baeb998',
  },
};

// another id
export const otherIdRaw = {
  address: '0x818B6337657A23F58581715Fc610577292e521D0',
  identity: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: '0x818B6337657A23F58581715Fc610577292e521D0',
  },
  privateKey: '0x4025da5692759add08f98f4b056c41c71916a671cedc7584a80d73adc7fb43c0',
  publicKey:
    'cf4a1d0bbef8bf0e3fa479a9def565af1b22ea6266294061bfb430701b54a83699e3d47bf52e9f0224dcc29a02721810f1f624f1f70ea3cc5f1fb752cfed379d',
  signatureParams: {
    method: SignatureTypes.METHOD.ECDSA,
    privateKey: '0x4025da5692759add08f98f4b056c41c71916a671cedc7584a80d73adc7fb43c0',
  },
};

// USDC currency
export const USDC: ICurrency = {
  type: RequestLogicTypes.CURRENCY.ERC20,
  value: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  network: 'mainnet'
}

export const requestIdMock = '0x1c2610cbc5bee43b6bc9800e69ec832fb7d50ea098a88877a0afdcac5981d3f8';
export const arbitraryExpectedAmount = '123400000000000000';
export const arbitraryDeltaAmount = '100000000000000000';

export const arbitraryExpectedAmountMinusDelta = '23400000000000000';
export const arbitraryExpectedAmountPlusDelta = '223400000000000000';

export const arbitraryTimestamp = 1544426030;

export const paymentAddress = '0x627306090abaB3A6e1400e9345bC60c78a8BEf57';

export const pcUSDCparams: ICreationParameters = {
  pcOptions: [{
    oracle: "https://min-api.cryptocompare.com/data/v2/histominute",
    timeframe: 60,
    currency: USDC,
  }]
}

export const pcUSDCvalues: IValues = {
  pcOptions: [{
    oracle: "https://min-api.cryptocompare.com/data/v2/histominute",
    timeframe: 60,
    currency: USDC,
  }]
}

export const createPcExchangeRateUSDC: ExtensionTypes.IAction = {
  action: ExtensionTypes.PcExchangeRate.ACTION.CREATE,
  id: ExtensionTypes.ID.PAYMENT_CONTEXT_EXCHANGE_RATE,
  parameters: pcUSDCparams,
  version: '0.1.0',
};

export const actionAddPaymentAddress = {
  action: ExtensionTypes.PnReferenceBased.ACTION.ADD_PAYMENT_ADDRESS,
  id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT,
  parameters: {
    paymentAddress,
  },
};

/* 
* Extension states
*/

export const exchangeRateUsdcState: RequestLogicTypes.IExtensionStates = {
  [ExtensionTypes.ID.PAYMENT_CONTEXT_EXCHANGE_RATE as string]: {
    events: [],
    id: ExtensionTypes.ID.PAYMENT_CONTEXT_EXCHANGE_RATE,
    type: ExtensionTypes.TYPE.PAYMENT_CONTEXT,
    values: pcUSDCvalues,
    version: '0.1.0',
  },
};


export const pnpcUsdcState: RequestLogicTypes.IExtensionStates = {
  // Payment context = USDC to EUR
  [ExtensionTypes.ID.PAYMENT_CONTEXT_EXCHANGE_RATE as string]: {
    events: [
      {
        name: ExtensionTypes.PcExchangeRate.ACTION.CREATE,
        parameters: pcUSDCparams,
        timestamp: arbitraryTimestamp,
      },
    ],
    id: ExtensionTypes.ID.PAYMENT_CONTEXT_EXCHANGE_RATE,
    type: ExtensionTypes.TYPE.PAYMENT_CONTEXT,
    values: pcUSDCvalues,
    version: '0.1.0',
  },
  // Payment network ERC20 = USDC payment detection
  [ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT as string]: {
    events: [
      {
        name: ExtensionTypes.PnReferenceBased.ACTION.CREATE,
        parameters: {},
        timestamp: arbitraryTimestamp,
      },
      {
        name: ExtensionTypes.PnReferenceBased.ACTION.ADD_PAYMENT_ADDRESS,
        parameters: {
          paymentAddress,
        },
        timestamp: arbitraryTimestamp,
      },
    ],
    id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {
      paymentAddress,
    },
    version: '0.1.0',
  },
};

export const requestUsdcEur: RequestLogicTypes.IRequest = {
  creator: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: payeeRaw.address,
  },
  // Payment documented in EUR
  currency: {
    type: RequestLogicTypes.CURRENCY.ISO4217,
    value: 'EUR',
  },
  events: [
    {
      actionSigner: {
        type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
        value: payeeRaw.address,
      },
      name: RequestLogicTypes.ACTION_NAME.CREATE,
      parameters: {
        expectedAmount: arbitraryExpectedAmount,
        extensionsDataLength: 2,
        isSignedRequest: false,
      },
      timestamp: arbitraryTimestamp,
    },
  ],
  expectedAmount: arbitraryExpectedAmount,
  // Payment network + context = USDC payment + USDC/EUR conversion
  extensions: pnpcUsdcState,
  extensionsData: [createPcExchangeRateUSDC, actionAddPaymentAddress],
  payee: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: payeeRaw.address,
  },
  payer: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: payerRaw.address,
  },
  requestId: requestIdMock,
  state: RequestLogicTypes.STATE.CREATED,
  timestamp: arbitraryTimestamp,
  version: '0.1.0',
};

export const requestCreatedNoExtension: RequestLogicTypes.IRequest = {
  creator: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: payeeRaw.address,
  },
  currency: {
    type: RequestLogicTypes.CURRENCY.ETH,
    value: 'ETH',
  },
  events: [
    {
      actionSigner: {
        type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
        value: payeeRaw.address,
      },
      name: RequestLogicTypes.ACTION_NAME.CREATE,
      parameters: {
        expectedAmount: '123400000000000000',
        extensionsDataLength: 0,
        isSignedRequest: false,
      },
      timestamp: arbitraryTimestamp,
    },
  ],
  expectedAmount: arbitraryExpectedAmount,
  extensions: {},
  extensionsData: [],
  payee: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: payeeRaw.address,
  },
  payer: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: payerRaw.address,
  },
  requestId: requestIdMock,
  state: RequestLogicTypes.STATE.CREATED,
  timestamp: arbitraryTimestamp,
  version: '0.1.0',
};
