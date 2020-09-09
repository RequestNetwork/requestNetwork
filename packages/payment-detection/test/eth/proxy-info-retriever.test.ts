// tslint:disable: no-invalid-this
// tslint:disable: no-magic-numbers
import { PaymentTypes } from '@requestnetwork/types';
import ProxyETHInfoRetriever from '../../src/eth/proxy-info-retriever';

const proxyContractAddress = '0xf204a4ef082f5c04bb89f7d5e6568b796096735a';
const paymentReferenceMock = '0111111111111111111111111111111111111111111111111';

/* tslint:disable:no-unused-expression */
describe('api/eth/proxy-info-retriever', () => {
  describe('on localhost', () => {
    const paymentAddress = '0xf17f52151ebef6c7334fad080c5704d77216b732';

    it('can get the localhost balance of an address', async () => {
      const infoRetriever = new ProxyETHInfoRetriever(
        paymentReferenceMock,
        proxyContractAddress,
        0,
        paymentAddress,
        PaymentTypes.EVENTS_NAMES.PAYMENT,
        'private',
      );

      // inject mock provider.getLogs()
      infoRetriever.provider.getLogs = (): any => {
        return [
          {
            address: proxyContractAddress,
            blockHash: '0xe8693d0fb897eac7c350696834f4cf36be3b7d86f746d6764d9903a06dc5fe44',
            blockNumber: 115,
            data: `0x000000000000000000000000f17f52151ebef6c7334fad080c5704d77216b7320000000000000000000000000000000000000000000000000000000000000001`,
            logIndex: 2,
            topics: [
              '0xf20789bd5e67749fbe748d26a9ffacd11036adee6a64a8dbc70cc37a98b4e542',
              '0x6330b989705733cc5c1f7285b8a5b892e08be86ed6fbe9d254713a4277bc5bd2',
            ],
            transactionHash: '0x66e20126e917ede3543c79357c71ddeda2af68e27d684fd5aa6a813bb6946ce4',
            transactionIndex: 0,
          },
        ];
      };

      // inject mock provider.getBlock()
      infoRetriever.provider.getBlock = (): any => {
        return {
          timestamp: 69,
        };
      };

      const events = await infoRetriever.getTransferEvents();

      // if this assert fails it means this address received another transaction
      expect(events).toHaveLength(1);
      expect(events[0].name).toBe(PaymentTypes.EVENTS_NAMES.PAYMENT);
      expect(events[0].amount).toBe('1');
      expect(typeof events[0].timestamp).toBe('number');
      expect(typeof events[0].parameters!.block).toBe('number');
      expect(typeof events[0].parameters!.txHash).toBe('string');
    });

    it('gets an empty list of events for an address without ETH on localhost', async () => {
      const infoRetriever = new ProxyETHInfoRetriever(
        paymentReferenceMock,
        proxyContractAddress,
        0,
        paymentAddress,
        PaymentTypes.EVENTS_NAMES.PAYMENT,
        'private',
      );

      // inject mock provider.getLogs()
      infoRetriever.provider.getLogs = (): any => {
        return [];
      };

      const events = await infoRetriever.getTransferEvents();
      expect(Object.keys(events)).toHaveLength(0);
    });
  });
});
