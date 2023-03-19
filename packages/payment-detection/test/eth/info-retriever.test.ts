import { PaymentTypes } from '@requestnetwork/types';
import { EthInputDataInfoRetriever } from '../../src/eth/info-retriever';
import PaymentReferenceCalculator from '../../src/payment-reference-calculator';

describe('api/eth/info-retriever', () => {
  // In this test, we're looking this transaction:
  //  https://etherscan.io/tx/0x0de1759d8b246939e370e1d0509e3ed6f1d5f4f5b79735636c0283b64ff6f5ed
  it('can get the balance of an address', async () => {
    const paymentAddress = '0xc12F17Da12cd01a9CDBB216949BA0b41A6Ffc4EB';
    const paymentReference = PaymentReferenceCalculator.calculate(
      '01000',
      '1234567890123456',
      paymentAddress,
    ); // 9649a1a4dd5854ed

    const infoRetriever = new EthInputDataInfoRetriever(
      paymentAddress,
      PaymentTypes.EVENTS_NAMES.PAYMENT,
      'mainnet',
      paymentReference,
    );
    const events = await infoRetriever.getTransferEvents();

    // If this assertion fails, another transaction with the data `9649a1a4dd5854ed`
    //  has been set to the address `0xc12F17Da12cd01a9CDBB216949BA0b41A6Ffc4EB`
    expect(events).toHaveLength(1);

    expect(events[0].name).toBe('payment');
    expect(events[0].amount).toBe('33');
    expect(typeof events[0].timestamp).toBe('number');
    expect(events[0].parameters!.txHash).toBe(
      '0x0b53c5296a7b286fef52336529f3934584fea116725d1fe4c59552e926229059',
    );
    expect(typeof events[0].parameters!.block).toBe('number');
    expect(typeof events[0].parameters!.confirmations).toBe('number');
  }, 10000);

  it('throws when trying to use it in local', async () => {
    const infoRetreiver = new EthInputDataInfoRetriever(
      '0x01',
      PaymentTypes.EVENTS_NAMES.PAYMENT,
      'private',
      '12345',
    );
    await expect(infoRetreiver.getTransferEvents()).rejects.toThrowError();
  });

  // Utility for conditionally skipping tests
  const describeIf = (
    condition: any,
    ...args: [string | number | Function | jest.FunctionLike, jest.EmptyFunction]
  ) => (condition ? describe(...args) : describe.skip(...args));

  // Skip tests if build is from external fork or API tests are disabled
  // External forks cannot access secret API keys
  describeIf(!process.env.CIRCLE_PR_NUMBER && !process.env.DISABLE_API_TESTS, 'Multichain', () => {
    // TODO temporary disable xDAI, CELO, Sokol, and Goerli
    // FIXME: API-based checks should run nightly and be mocked for CI
    [
      'mainnet',
      // 'rinkeby',
      // 'goerli',
      // 'xdai',
      // 'sokol',
      'fuse',
      //'celo',
      'matic',
      'fantom',
    ].forEach((network) => {
      it(`Can get the balance on ${network}`, async () => {
        const retriever = new EthInputDataInfoRetriever(
          '0xc12F17Da12cd01a9CDBB216949BA0b41A6Ffc4EB',
          PaymentTypes.EVENTS_NAMES.PAYMENT,
          network,
          '9649a1a4dd5854ed',
          process.env[`EXPLORER_API_KEY_${network.toUpperCase()}`],
        );
        await expect(retriever.getTransferEvents()).resolves.not.toThrow();
      });
    });

    it('can detect a MATIC payment to self', async () => {
      // NB: The from and to are the same
      const paymentAddress = '0x4E64C2d06d19D13061e62E291b2C4e9fe5679b93';
      const paymentReference = PaymentReferenceCalculator.calculate(
        '01b809015dcda94dccfc626609b0a1d8f8e656ec787cf7f59d59d242dc9f1db0ca',
        'a1a2a3a4a5a6a7a8',
        paymentAddress,
      );

      const infoRetriever = new EthInputDataInfoRetriever(
        paymentAddress,
        PaymentTypes.EVENTS_NAMES.PAYMENT,
        'matic',
        paymentReference,
        process.env[`EXPLORER_API_KEY_MATIC`],
      );
      const events = await infoRetriever.getTransferEvents();
      expect(events).toHaveLength(1);

      expect(events[0].amount).toBe('1000000000000000');
    });
  });
});
