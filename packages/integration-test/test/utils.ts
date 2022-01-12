import { ExtensionTypes, IdentityTypes, RequestLogicTypes } from '@requestnetwork/types';

export const createMockErc20FeeRequest = ({
  network,
  tokenAddress,
  paymentAddress,
  salt,
  requestId,
}: Record<
  'network' | 'tokenAddress' | 'paymentAddress' | 'salt' | 'requestId',
  string
>): RequestLogicTypes.IRequest => ({
  creator: { type: IdentityTypes.TYPE.ETHEREUM_ADDRESS, value: '0x2' },
  currency: {
    network,
    type: RequestLogicTypes.CURRENCY.ERC20,
    value: tokenAddress,
  },
  events: [],
  expectedAmount: '0',
  extensions: {
    [ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT]: {
      events: [],
      id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT,
      type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
      values: {
        paymentAddress,
        salt,
      },
      version: '0.1.0',
    },
  },
  extensionsData: [],
  requestId,
  state: RequestLogicTypes.STATE.CREATED,
  timestamp: 0,
  version: '0.2',
});
