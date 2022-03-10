import { SuperFluidPaymentDetector } from '@requestnetwork/payment-detection';
import {
  ExtensionTypes,
  IdentityTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';

import { mockAdvancedLogic } from './mocks';

const createMockRequest = ({
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
  expectedAmount: '320833333333331260',
  extensions: {
    [ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT]: {
      events: [],
      id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT,
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

const detector = new SuperFluidPaymentDetector({
  advancedLogic: mockAdvancedLogic,
});

describe('ERC777 SuperFluid detection test-suite', () => {
  it('can getBalance on a rinkeby request', async () => {
    const mockRequest = createMockRequest({
      network: 'rinkeby',
      requestId: '0288792633ff0ec72a7dbdefb886d2db6cccfa98287320839c2f273c7a4e3ce7e2',
      paymentAddress: '0x52e5bcfa46393894afcfe6cd98a6761fa692c594',
      salt: '0ee84db293a752c6',
      tokenAddress: '0x745861aed1eee363b4aaa5f1994be40b1e05ff90', // FAU
    });

    const balance = await detector.getBalance(mockRequest);

    expect(balance.balance).toBe('320833333333331260');
    expect(balance.events).toHaveLength(1);
    expect(balance.events[0].name).toBe('payment');
    const params = balance.events[0].parameters as PaymentTypes.IERC20FeePaymentEventParameters;
    expect(params.to).toBe('0x52e5bcfa46393894afcfe6cd98a6761fa692c594');
    expect(balance.events[0].amount).toBe('320833333333331260');
    expect(balance.events[0].timestamp).toBe('1642693617');
  });
});
