// tslint:disable: no-invalid-this
// tslint:disable: no-magic-numbers
import { PaymentTypes } from '@requestnetwork/types';
import ProxyERC20InfoRetriever from '../../src/erc20/proxy-info-retriever';

import 'chai';
import 'mocha';

const chai = require('chai');
const expect = chai.expect;

const erc20LocalhostContractAddress = '0x9FBDa871d559710256a2502A2517b794B482Db40';
const proxyContractAddress = '0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4';
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
      infoRetriever.provider.getLogs = (): any => {
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
      expect(events).to.have.lengthOf(1);
      expect(events[0].name).to.equal(PaymentTypes.EVENTS_NAMES.PAYMENT);
      expect(events[0].amount).to.equal('1');
      expect(events[0].timestamp).to.be.a('number');
      expect(events[0].parameters!.to).to.equal(paymentAddress);
      expect(events[0].parameters!.block).to.be.a('number');
      expect(events[0].parameters!.txHash).to.be.a('string');
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
      expect(events).to.be.empty;
    });
  });
});
