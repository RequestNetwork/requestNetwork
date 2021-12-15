/* eslint-disable no-invalid-this */
/* eslint-disable no-magic-numbers */
import EscrowERC20InfoRetriever from '../../src/erc20/escrow-info-retriever';
import { ethers } from 'ethers';
import { PaymentTypes } from '@requestnetwork/types';

const escrowContractAddress = '0xF08dF3eFDD854FEDE77Ed3b2E515090EEe765154';
const paymentReferenceMock = 'aaaa';

/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('api/erc20/escrow-info-retriever', () => {
  describe('on mocked logs', () => {
    const initEmergencyLog = {
      blockNumber: 38,
      blockHash: '0x5be4f7b06ebbe0df573da7bc70768247abdc4e03e70264e946226d7154e42742',
      transactionIndex: 0,
      address: '0xB9B7e0cb2EDF5Ea031C8B297A5A1Fa20379b6A0a',
      data:
        '0x3a322d4500000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000002aaaa000000000000000000000000000000000000000000000000000000000000',
      topics: [
        '0x37b4fae7fd90ce3674204f79d686d40c4069a66c402976717d4f30817c0c0939',
        '0x6330b989705733cc5c1f7285b8a5b892e08be86ed6fbe9d254713a4277bc5bd2',
      ],
      transactionHash: '0x4c88a33fb62e2999fc365141f99d5f278eb68e8f68165be07c74839921cdb564',
      logIndex: 1,
      removed: false,
    };
    const freezeLog = {
      blockNumber: 38,
      blockHash: '0x5be4f7b06ebbe0df573da7bc70768247abdc4e03e70264e946226d7154e42742',
      transactionIndex: 0,
      address: '0xB9B7e0cb2EDF5Ea031C8B297A5A1Fa20379b6A0a',
      data:
        '0x82865e9d00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000002aaaa000000000000000000000000000000000000000000000000000000000000',
      topics: [
        '0x5e14b9b7c3d9675ce5ecb24ee8181d371561709a08aa9c412acb36627386dba8',
        '0x6330b989705733cc5c1f7285b8a5b892e08be86ed6fbe9d254713a4277bc5bd2',
      ],
      transactionHash: '0x4c88a33fb62e2999fc365141f99d5f278eb68e8f68165be07c74839921cdb564',
      logIndex: 2,
      removed: false,
    };
    const revertEmergencyLog = {
      blockNumber: 38,
      blockHash: '0x5be4f7b06ebbe0df573da7bc70768247abdc4e03e70264e946226d7154e42742',
      transactionIndex: 0,
      address: '0xB9B7e0cb2EDF5Ea031C8B297A5A1Fa20379b6A0a',
      data:
        '0x0797560800000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000002aaaa000000000000000000000000000000000000000000000000000000000000',
      topics: [
        '0xcc401323a0bd24a2e6e1564e168c52332731fff1a2937d998ee25462588ba0fa',
        '0x6330b989705733cc5c1f7285b8a5b892e08be86ed6fbe9d254713a4277bc5bd2',
      ],
      transactionHash: '0x4c88a33fb62e2999fc365141f99d5f278eb68e8f68165be07c74839921cdb564',
      logIndex: 3,
      removed: false,
    };

    let infoRetriever: EscrowERC20InfoRetriever;
    let getBlockSpy: jest.SpyInstance;
    let getLogsSpy: jest.SpyInstance;

    beforeEach(() => {
      infoRetriever = new EscrowERC20InfoRetriever(
        paymentReferenceMock,
        escrowContractAddress,
        0,
        'private',
      );

      getBlockSpy = jest.spyOn(infoRetriever.provider, 'getBlock').mockResolvedValue({
        timestamp: 69,
      } as any);
      getLogsSpy = jest
        .spyOn(infoRetriever.provider, 'getLogs')
        .mockImplementation((filter: ethers.EventFilter) => {
          const initEmergencyClaimTopic =
            '0x37b4fae7fd90ce3674204f79d686d40c4069a66c402976717d4f30817c0c0939';
          const frozenRequestTopic =
            '0x5e14b9b7c3d9675ce5ecb24ee8181d371561709a08aa9c412acb36627386dba8';
          const revertedEmergencyTopic =
            '0xcc401323a0bd24a2e6e1564e168c52332731fff1a2937d998ee25462588ba0fa';
          if (filter.topics?.includes(initEmergencyClaimTopic)) {
            return Promise.resolve([initEmergencyLog]);
          }
          if (filter.topics?.includes(frozenRequestTopic)) {
            return Promise.resolve([freezeLog]);
          }
          if (filter.topics?.includes(revertedEmergencyTopic)) {
            return Promise.resolve([revertEmergencyLog]);
          }
          return Promise.resolve([]);
        });
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('can get the FROZEN_PAYMENT event of an address out of mocked logs', async () => {
      const events = await infoRetriever.getContractEvents();
      expect(events).toHaveLength(3);
      expect(events).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: PaymentTypes.ESCROW_EVENTS_NAMES.FROZEN_PAYMENT }),
        ]),
      );
      expect(getBlockSpy).toHaveBeenCalledTimes(3);
      expect(getLogsSpy).toHaveBeenCalledTimes(3);
    });
    it('can get the INITIATED_EMERGENCY_CLAIM event of an address out of mocked logs', async () => {
      const events = await infoRetriever.getContractEvents();
      expect(events).toHaveLength(3);
      expect(events).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: PaymentTypes.ESCROW_EVENTS_NAMES.INITIATED_EMERGENCY_CLAIM,
          }),
        ]),
      );
      expect(getBlockSpy).toHaveBeenCalledTimes(3);
      expect(getLogsSpy).toHaveBeenCalledTimes(3);
    });
    it('can get the REVERTED_EMERGENCY_CLAIM event of an address out of mocked logs', async () => {
      const events = await infoRetriever.getContractEvents();
      expect(events).toHaveLength(3);
      expect(events).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: PaymentTypes.ESCROW_EVENTS_NAMES.REVERTED_EMERGENCY_CLAIM,
          }),
        ]),
      );
      expect(getBlockSpy).toHaveBeenCalledTimes(3);
      expect(getLogsSpy).toHaveBeenCalledTimes(3);
    });
  });
});
