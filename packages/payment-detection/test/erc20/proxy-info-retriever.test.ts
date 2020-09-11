// tslint:disable: no-invalid-this
// tslint:disable: no-magic-numbers
import { PaymentTypes } from '@requestnetwork/types';
import ProxyERC20InfoRetriever from '../../src/erc20/proxy-info-retriever';
import { ethers } from 'ethers';

const erc20LocalhostContractAddress = '0x9FBDa871d559710256a2502A2517b794B482Db40';
const proxyContractAddress = '0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4';
const feeProxyContractAddress = '0x75c35C980C0d37ef46DF04d31A140b65503c0eEd';
const paymentReferenceMock = '0111111111111111111111111111111111111111111111111';

/* tslint:disable:no-unused-expression */
describe('api/erc20/proxy-info-retriever', () => {
  describe('on localhost', () => {
    const paymentAddress = '0xf17f52151ebef6c7334fad080c5704d77216b732';

    it('can get the localhost balance of an address', async () => {
      const infoRetriever = new ProxyERC20InfoRetriever(
        paymentReferenceMock,
        proxyContractAddress,
        0,
        erc20LocalhostContractAddress,
        paymentAddress,
        PaymentTypes.EVENTS_NAMES.PAYMENT,
        'private',
      );

      // inject mock provider.getLogs()
      infoRetriever.provider.getLogs = (filter: ethers.EventFilter): any => {
        if (
          !filter.topics?.includes(
            '0x4d4e9dbb7207a31cc25529ccb52e52ddba30ded7734e32691d13da66df7f81da',
          )
        ) {
          return [];
        }
        return [
          {
            address: proxyContractAddress,
            blockHash: '0xe8693d0fb897eac7c350696834f4cf36be3b7d86f746d6764d9903a06dc5fe44',
            blockNumber: 115,
            data: `0x000000000000000000000000${erc20LocalhostContractAddress.slice(
              2,
            )}000000000000000000000000f17f52151ebef6c7334fad080c5704d77216b7320000000000000000000000000000000000000000000000000000000000000001`,
            logIndex: 2,
            topics: [
              '0x4d4e9dbb7207a31cc25529ccb52e52ddba30ded7734e32691d13da66df7f81da',
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
      expect(events[0].parameters!.to).toBe(paymentAddress);
      expect(typeof events[0].parameters!.block).toBe('number');
      expect(typeof events[0].parameters!.txHash).toBe('string');
    });

    it('can get the localhost fees of an address', async () => {
      const infoRetriever = new ProxyERC20InfoRetriever(
        'b7182613b46c5e92',
        feeProxyContractAddress,
        0,
        erc20LocalhostContractAddress,
        '0x627306090abab3a6e1400e9345bc60c78a8bef57',
        PaymentTypes.EVENTS_NAMES.PAYMENT,
        'private',
      );

      // inject mock provider.getLogs()
      infoRetriever.provider.getLogs = (filter: ethers.EventFilter): any => {
        if (
          !filter.topics?.includes(
            '0x9f16cbcc523c67a60c450e5ffe4f3b7b6dbe772e7abcadb2686ce029a9a0a2b6',
          )
        ) {
          return [];
        }
        return [
          {
            blockNumber: 28,
            blockHash: '0x40496f2205f0c8d819c2cab683a5a7e0b20b49d3d891c8943780138670f184c7',
            transactionIndex: 0,
            address: feeProxyContractAddress,
            data:
              '0x0000000000000000000000009fbda871d559710256a2502a2517b794b482db40000000000000000000000000627306090abab3a6e1400e9345bc60c78a8bef57000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000c5fdf4076b8f3a5357c5e395ab970b5b54098fef',
            topics: [
              '0x9f16cbcc523c67a60c450e5ffe4f3b7b6dbe772e7abcadb2686ce029a9a0a2b6',
              '0xa1801d1208f939d16ff239f43c66983c01b1f107994ff695f6a195be4137c796',
            ],
            transactionHash: '0xa4ccc5094096fb6b2e744cb602ade7f37d0c78d8847e58471d6de786fc9c5283',
            logIndex: 4,
          },
        ];
      };

      // inject mock provider.getBlock()
      infoRetriever.provider.getBlock = (): any => {
        return {
          timestamp: 10,
        };
      };

      const events = await infoRetriever.getTransferEvents();

      // if this assert fails it means this address received another transaction
      expect(events).toHaveLength(1);

      const event = events[0];
      expect(event.name).toBe(PaymentTypes.EVENTS_NAMES.PAYMENT);
      expect(event.amount).toBe('10');
      expect(typeof event.timestamp).toBe('number');

      const parameters: PaymentTypes.IERC20FeePaymentEventParameters = event.parameters!;

      expect(parameters.to).toBe('0x627306090abab3a6e1400e9345bc60c78a8bef57');
      expect(typeof parameters.block).toBe('number');
      expect(typeof parameters.txHash).toBe('string');
      expect(parameters.feeAddress).toBe('0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef');
      expect(parameters.feeAmount).toBe('1');
    });

    it('gets an empty list of events for an address without ERC20 on localhost', async () => {
      const infoRetriever = new ProxyERC20InfoRetriever(
        paymentReferenceMock,
        proxyContractAddress,
        0,
        erc20LocalhostContractAddress,
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
