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
    expect(balance.events[0].parameters?.txHash).toBe(
      '0xed57733272ad5cb96725ceb0a22e1dcc5701a7b78f219768c8281b7ea6a87574',
    );
    expect(balance.events[0].parameters?.to).toBe('0x4E64C2d06d19D13061e62E291b2C4e9fe5679b93');
    // FIXME should be set when Mainnet uses TheGraph
    // expect(balance.events[0].parameters?.from).toBe('0x4e64c2d06d19d13061e62e291b2c4e9fe5679b93');
    expect(balance.events[0].amount).toBe('1000000000000000000');
    expect(balance.events[0].timestamp).toBe(1599070058);
    // FIXME should be set when Mainnet uses TheGraph
    // expect(balance.events[0].parameters.gasPrice).toBe('1000000000');
    // expect(balance.events[0].parameters.gasUsed).toBe('70626');
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
    expect(balance.events[0].parameters?.txHash).toBe(
      '0x751dfbdbc049fb05652228a1c07317e2dd22e47172b83b6c21f426f9f09975b1',
    );
    expect(balance.events[0].parameters?.to).toBe('0x4E64C2d06d19D13061e62E291b2C4e9fe5679b93');
    // FIXME should be set when Rinkeby uses TheGraph
    // expect(balance.events[0].parameters?.from).toBe('0xF4255c5e53a08f72b0573D1b8905C5a50aA9c2De');
    expect(balance.events[0].amount).toBe('1000000000000000000000');
    expect(balance.events[0].timestamp).toBe(1599013969);
    // FIXME should be set when Rinkeby uses TheGraph
    // expect(balance.events[0].parameters.gasPrice).toBe('472000000000');
    // Warning: TheGraph returns 100000 but the gasUsed value on etherscan & other is 51055
    // expect(balance.events[0].parameters.gasUsed).toBe('51055');
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
    expect(balance.events[0].parameters?.txHash).toBe(
      '0xb84736493f9c39dfd48ab814198d07a500b03d6622061d1300be624860532ffa',
    );
    expect(balance.events[0].parameters?.to).toBe('0x4E64C2d06d19D13061e62E291b2C4e9fe5679b93');
    expect(balance.events[0].parameters.from).toBe('0x4E64C2d06d19D13061e62E291b2C4e9fe5679b93');
    expect(balance.events[0].amount).toBe('1000000000000000000');
    expect(balance.events[0].timestamp).toBe(1621953168);
    expect(balance.events[0].parameters.gasPrice).toBe('1000000000');
    expect(balance.events[0].parameters.gasUsed).toBe('64511');
  }, 15000);
});
