/* eslint-disable @typescript-eslint/no-unused-expressions */
import { PaymentTypes } from '@requestnetwork/types';
import TheGraphInfoRetriever from '../../src/erc20/thegraph-info-retriever';

describe('api/erc20/escrow-thegraph-info-retriever', () => {
  describe('on rinkeby', () => {
    const RINKEBY_ESCROW_CONTRACT = '0xff1cae28e5a5b199ccbaae5257b118372095aa26';

    it('should get escrow event list in correct order via subgraph', async () => {
      const eventList = [
        {
          from: '0x186e7fe6c34ea0eca7f9c2fd29651fc0443e3f29',
          txHash: '0x7db4bfda43a77b6f3a31d7c05cee930d4669cfb80834735e91b4dbda885a1964',
          eventName: 'paidEscrow',
          timestamp: 1648814320,
          block: 10428275,
        },
        {
          from: '0x5000ee9fb9c96a2a09d8efb695ac21d6c429ff11',
          txHash: '0xd0af88ef673c6fbd1733b6dc2d6cce2f030cd66abc2f704bad613518f0a06168',
          eventName: 'initiateEmergencyClaim',
          timestamp: 1648814605,
          block: 10428294,
        },
        {
          from: '0x5000ee9fb9c96a2a09d8efb695ac21d6c429ff11',
          txHash: '0x74fd1aa9ceb8f359bc8d21aa53c7c99d3bbe4c81b86c76b92abd041c12d402be',
          eventName: 'paidIssuer',
          timestamp: 1648815071,
          block: 10428325,
        },
      ];
      const paymentReference = '07cf432fc93c665e';

      const graphRetriever = new TheGraphInfoRetriever(
        paymentReference,
        RINKEBY_ESCROW_CONTRACT,
        '0xfab46e002bbf0b4509813474841e0716e6730136',
        RINKEBY_ESCROW_CONTRACT,
        PaymentTypes.EVENTS_NAMES.PAYMENT,
        'rinkeby',
      );
      const allNetworkEvents = await graphRetriever.getTransferEvents();
      const escrowEvents = allNetworkEvents.escrowEvents || [];
      expect(escrowEvents[0].name).toEqual('escrow');
      expect(escrowEvents[0].parameters?.block).toEqual(eventList[0].block);
      expect(escrowEvents[0].parameters?.eventName).toEqual(eventList[0].eventName);
      expect(escrowEvents[0].parameters?.from).toEqual(eventList[0].from);
      expect(escrowEvents[0].timestamp).toEqual(eventList[0].timestamp);
      expect(escrowEvents[0].parameters?.txHash).toEqual(eventList[0].txHash);

      expect(escrowEvents[1].parameters?.block).toEqual(eventList[1].block);
      expect(escrowEvents[1].parameters?.eventName).toEqual(eventList[1].eventName);
      expect(escrowEvents[1].parameters?.from).toEqual(eventList[1].from);
      expect(escrowEvents[1].timestamp).toEqual(eventList[1].timestamp);
      expect(escrowEvents[1].parameters?.txHash).toEqual(eventList[1].txHash);

      expect(escrowEvents[2].parameters?.block).toEqual(eventList[2].block);
      expect(escrowEvents[2].parameters?.eventName).toEqual(eventList[2].eventName);
      expect(escrowEvents[2].parameters?.from).toEqual(eventList[2].from);
      expect(escrowEvents[2].timestamp).toEqual(eventList[2].timestamp);
      expect(escrowEvents[2].parameters?.txHash).toEqual(eventList[2].txHash);
    });
  });
});
