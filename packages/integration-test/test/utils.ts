import {
  CurrencyTypes,
  ExtensionTypes,
  IdentityTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';

export const createMockErc20FeeRequest = ({
  network,
  tokenAddress,
  paymentAddress,
  salt,
  requestId,
  feeAddress,
  feeAmount,
}: Record<
  'tokenAddress' | 'paymentAddress' | 'salt' | 'requestId' | 'feeAddress' | 'feeAmount',
  string
> & { network: CurrencyTypes.EvmChainName }): RequestLogicTypes.IRequest => ({
  creator: { type: IdentityTypes.TYPE.ETHEREUM_ADDRESS, value: '0x2' },
  currency: {
    network,
    type: RequestLogicTypes.CURRENCY.ERC20,
    value: tokenAddress,
  },
  events: [],
  expectedAmount: '0',
  extensions: {
    [ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT]: {
      events: [],
      id: ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT,
      type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
      values: {
        paymentAddress,
        salt,
        feeAddress,
        feeAmount,
      },
      version: '0.1.0',
    },
  },
  extensionsData: [],
  requestId,
  state: RequestLogicTypes.STATE.CREATED,
  timestamp: 0,
  version: '0.2.0',
});
