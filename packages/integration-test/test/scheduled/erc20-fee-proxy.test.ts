import { Erc20PaymentNetwork } from '@requestnetwork/payment-detection';
import { ExtensionTypes, IdentityTypes, RequestLogicTypes } from '@requestnetwork/types';

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

const erc20AddressedBased = new Erc20PaymentNetwork.FeeProxyContract({
  advancedLogic: mockAdvancedLogic,
});

describe('ERC20 Fee Proxy detection test-suite', () => {
  it('can getBalance on a mainnet request', async () => {
    const mockRequest = createMockRequest({
      network: 'mainnet',
      requestId: '016d4cf8006982f7d91a437f8c72700aa62767de00a605133ee5f84ad8d224ba04',
      paymentAddress: '0x4E64C2d06d19D13061e62E291b2C4e9fe5679b93',
      salt: '8097784e131ee627',
      tokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
    });

    const balance = await erc20AddressedBased.getBalance(mockRequest);

    expect(balance.balance).toBe('1000000000000000000');
    expect(balance.events).toHaveLength(1);
    expect(balance.events[0].name).toBe('payment');
    expect(balance.events[0].parameters?.to).toBe('0x4E64C2d06d19D13061e62E291b2C4e9fe5679b93');
    expect(balance.events[0].amount).toBe('1000000000000000000');
    expect(balance.events[0].timestamp).toBe(1599070058);
  });

  it('can getBalance on a rinkeby request', async () => {
    const mockRequest = createMockRequest({
      network: 'rinkeby',
      requestId: '0188791633ff0ec72a7dbdefb886d2db6cccfa98287320839c2f173c7a4e3ce7e1',
      paymentAddress: '0x4E64C2d06d19D13061e62E291b2C4e9fe5679b93',
      salt: '0ee84db293a752c6',
      tokenAddress: '0xFab46E002BbF0b4509813474841E0716E6730136', // FAU
    });

    const balance = await erc20AddressedBased.getBalance(mockRequest);

    expect(balance.balance).toBe('1000000000000000000000');
    expect(balance.events).toHaveLength(1);
    expect(balance.events[0].name).toBe('payment');
    expect(balance.events[0].parameters?.to).toBe('0x4E64C2d06d19D13061e62E291b2C4e9fe5679b93');
    expect(balance.events[0].amount).toBe('1000000000000000000000');
    expect(balance.events[0].timestamp).toBe(1599013969);
  });

  it('can getBalance on a matic request, with TheGraph', async () => {
    const mockRequest = createMockRequest({
      network: 'matic',
      requestId: '014bcd076791fb915af457df1d3f26c81ff66f7e278e4a18f0e48a1705572a6306',
      paymentAddress: '0x4E64C2d06d19D13061e62E291b2C4e9fe5679b93',
      salt: '8c5ea6f8b4a14fe0',
      tokenAddress: '0x282d8efce846a88b159800bd4130ad77443fa1a1', // FAU
    });

    const balance = await erc20AddressedBased.getBalance(mockRequest);

    expect(balance.balance).toBe('1000000000000000000');
    expect(balance.events).toHaveLength(1);
    expect(balance.events[0].name).toBe('payment');
    expect(balance.events[0].parameters?.to).toBe('0x4E64C2d06d19D13061e62E291b2C4e9fe5679b93');
    expect(balance.events[0].amount).toBe('1000000000000000000');
    expect(balance.events[0].timestamp).toBe(1621953168);
  }, 15000);
});
