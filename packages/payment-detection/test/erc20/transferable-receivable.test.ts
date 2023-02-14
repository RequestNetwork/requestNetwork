import { CurrencyManager } from '@requestnetwork/currency';
import { TheGraphInfoRetriever } from '../../src/thegraph';
import PaymentReferenceCalculator from '../../src/payment-reference-calculator';
import { ERC20TransferableReceivablePaymentDetector } from '../../src/erc20';
import { AdvancedLogicTypes, PaymentTypes } from '@requestnetwork/types';
import { mockAdvancedLogicBase } from '../utils';
import ProxyERC20InfoRetriever from '../../src/erc20/proxy-info-retriever';
import { ethers, utils } from 'ethers';

let erc20TransferableReceivable: ERC20TransferableReceivablePaymentDetector;

const erc20LocalhostContractAddress = '0x9FBDa871d559710256a2502A2517b794B482Db40';
const transferableReceivableContractAddress = '0xF426505ac145abE033fE77C666840063757Be9cd';

const createAddPaymentAddressAction = jest.fn();
const createAddRefundAddressAction = jest.fn();
const createCreationAction = jest.fn();
const createAddPaymentInstructionAction = jest.fn();
const createAddRefundInstructionAction = jest.fn();

const mockAdvancedLogic: AdvancedLogicTypes.IAdvancedLogic = {
  ...mockAdvancedLogicBase,
  extensions: {
    erc20TransferableReceivable: {
      createAddPaymentAddressAction,
      createAddRefundAddressAction,
      createCreationAction,
      // inherited from declarative
      createAddPaymentInstructionAction,
      createAddRefundInstructionAction,
    },
  } as any as AdvancedLogicTypes.IAdvancedLogicExtensions,
};

const currencyManager = CurrencyManager.getDefault();

/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('api/erc20/transferable-receivable-contract', () => {
  beforeEach(() => {
    erc20TransferableReceivable = new ERC20TransferableReceivablePaymentDetector({
      advancedLogic: mockAdvancedLogic,
      currencyManager,
      getSubgraphClient: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('can createExtensionsDataForCreation', async () => {
    await erc20TransferableReceivable.createExtensionsDataForCreation({
      paymentAddress: 'ethereum address',
      salt: 'ea3bc7caf64110ca',
    });

    expect(createCreationAction).toHaveBeenCalledWith({
      paymentAddress: 'ethereum address',
      refundAddress: undefined,
      salt: 'ea3bc7caf64110ca',
    });
  });

  it('can createExtensionsDataForCreation with fee amount and address', async () => {
    await erc20TransferableReceivable.createExtensionsDataForCreation({
      paymentAddress: 'ethereum address',
      salt: 'ea3bc7caf64110ca',
    });

    expect(createCreationAction).toHaveBeenCalledWith({
      paymentAddress: 'ethereum address',
      refundAddress: undefined,
      salt: 'ea3bc7caf64110ca',
    });
  });

  it('can createExtensionsDataForCreation without salt', async () => {
    await erc20TransferableReceivable.createExtensionsDataForCreation({
      paymentAddress: 'ethereum address',
    });

    // Can't check parameters since salt is generated in createExtensionsDataForCreation
    expect(createCreationAction).toHaveBeenCalled();
  });

  it('can createExtensionsDataForAddPaymentInformation', async () => {
    erc20TransferableReceivable.createExtensionsDataForAddPaymentInformation({
      paymentInfo: 'ethereum address',
    });

    expect(createAddPaymentInstructionAction).toHaveBeenCalledWith({
      paymentInfo: 'ethereum address',
    });
  });

  it('can createExtensionsDataForAddPaymentAddress', async () => {
    erc20TransferableReceivable.createExtensionsDataForAddPaymentAddress({
      paymentAddress: 'ethereum address',
    });

    expect(createAddPaymentAddressAction).toHaveBeenCalledWith({
      paymentAddress: 'ethereum address',
    });
  });

  it('can createExtensionsDataForAddRefundAddress', async () => {
    erc20TransferableReceivable.createExtensionsDataForAddRefundAddress({
      refundAddress: 'ethereum address',
    });

    expect(createAddRefundAddressAction).toHaveBeenCalledWith({
      refundAddress: 'ethereum address',
    });
  });

  it('can createExtensionsDataForAddRefundInformation', async () => {
    erc20TransferableReceivable.createExtensionsDataForAddRefundInformation({
      refundInfo: 'ethereum address',
    });

    expect(createAddRefundInstructionAction).toHaveBeenCalledWith({
      refundInfo: 'ethereum address',
    });
  });

  it('can get payment events from proxy info retriever', async () => {
    const infoRetriever = new ProxyERC20InfoRetriever(
      'b7182613b46c5e92',
      transferableReceivableContractAddress,
      0,
      erc20LocalhostContractAddress,
      '',
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
        // Payment to recipient 1
        {
          blockNumber: 28,
          blockHash: '0x40496f2205f0c8d819c2cab683a5a7e0b20b49d3d891c8943780138670f184c7',
          transactionIndex: 0,
          address: transferableReceivableContractAddress,
          data: '0x0000000000000000000000009fbda871d559710256a2502a2517b794b482db40000000000000000000000000627306090abab3a6e1400e9345bc60c78a8bef57000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000c5fdf4076b8f3a5357c5e395ab970b5b54098fef',
          topics: [
            '0x9f16cbcc523c67a60c450e5ffe4f3b7b6dbe772e7abcadb2686ce029a9a0a2b6',
            '0xa1801d1208f939d16ff239f43c66983c01b1f107994ff695f6a195be4137c796',
          ],
          transactionHash: '0xa4ccc5094096fb6b2e744cb602ade7f37d0c78d8847e58471d6de786fc9c5283',
          logIndex: 4,
        },
        // Payment to recipient 2
        {
          blockNumber: 28,
          blockHash: '0x40496f2205f0c8d819c2cab683a5a7e0b20b49d3d891c8943780138670f184c7',
          transactionIndex: 0,
          address: transferableReceivableContractAddress,
          data: '0x0000000000000000000000009fbda871d559710256a2502a2517b794b482db40000000000000000000000000627306090abab3a6e1400e9345bc60c78a8bef58000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000c5fdf4076b8f3a5357c5e395ab970b5b54098fef',
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

    // isReceivable = false should not grab any payments
    let events = await infoRetriever.getTransferEvents();

    // if this assert fails it means this address received another transaction
    expect(events).toHaveLength(0);

    // isReceivable = true should grab both recipient 1 and recipient 2's payment
    events = await infoRetriever.getTransferEvents(true /* isReceivable */);

    // if this assert fails it means this address received another transaction
    expect(events).toHaveLength(2);
  });

  it('can get payments from thegraph info-retriever', async () => {
    const hashedReference = '0x6c93723bc5f82e6fbb2ea994bf0fb572fa19f7a2a3146065e21752b95668efe5';
    const paymentAddress = '0x5000ee9fb9c96a2a09d8efb695ac21d6c429ff11';
    const feeAddress = '0x5000ee9fb9c96a2a09d8efb695ac21d6c429ff12';
    const paymentData = {
      reference: hashedReference,
      txHash: '0x3e2d6cc2534b1d340ba2954f34e6cc819d6da64ff76863ea89c6d34b15d13c97',
      from: '0x186e7fe6c34ea0eca7f9c2fd29651fc0443e3f29',
      to: paymentAddress,
      network: 'rinkeby',
      salt: '0ee84db293a752c6',
      amount: '30000000000000',
      requestId: '0188791633ff0ec72a7dbdefb886d2db6cccfa98287320839c2f173c7a4e3ce7e1',
      block: 9606098,
      feeAddress: feeAddress,
      feeAmount: '0',
    };
    const shortReference = PaymentReferenceCalculator.calculate(
      '0188791633ff0ec72a7dbdefb886d2db6cccfa98287320839c2f173c7a4e3ce7e1',
      '0ee84db293a752c6',
      paymentAddress,
    );
    const onChainReference = utils.keccak256(`0x${shortReference}`);
    expect(onChainReference).toEqual(paymentData.reference);

    const paymentsMockData = {
      [hashedReference as string]: [
        // Correct reference but incorrect contract
        {
          contractAddress: '0x186e7fe6c34ea0eca7f9c2fd29651fc0443e3f32',
          to: paymentAddress,
          from: '0x186e7fe6c34ea0eca7f9c2fd29651fc0443e3f29',
          amount: '30000000000000',
          feeAmount: '0',
          reference: hashedReference,
          block: 9606098,
          txHash: '0x3e2d6cc2534b1d340ba2954f34e6cc819d6da64ff76863ea89c6d34b15d13c97',
          feeAddress: feeAddress,
          gasPrice: '',
          gasUsed: '',
          timestamp: 1,
        },
        // Correct reference and contract
        {
          contractAddress: erc20LocalhostContractAddress,
          to: paymentAddress,
          from: '0x186e7fe6c34ea0eca7f9c2fd29651fc0443e3f29',
          amount: '400',
          feeAmount: '0',
          reference: hashedReference,
          block: 9610470,
          txHash: '0x2f7b4752aa259166c038cd9073056c5979760cf0eea55d093fca2095c229313b',
          feeAddress: feeAddress,
          gasPrice: '',
          gasUsed: '',
          timestamp: 1,
        },
        // Correct reference and contract with different receivable owner
        {
          contractAddress: erc20LocalhostContractAddress,
          to: '0x186e7fe6c34ea0eca7f9c2fd29651fc0443e3f30',
          from: '0x186e7fe6c34ea0eca7f9c2fd29651fc0443e3f29',
          amount: '600',
          feeAmount: '0',
          reference: hashedReference,
          block: 9610471,
          txHash: '0x2f7b4752aa259166c038cd9073056c5979760cf0eea55d093fca2095c229313b',
          feeAddress: feeAddress,
          gasPrice: '',
          gasUsed: '',
          timestamp: 1,
        },
      ],
    };

    const clientMock = {
      GetPaymentsAndEscrowState: jest.fn().mockImplementation(({}) => ({
        payments: [],
        escrowEvents: [],
      })),
      GetPaymentsAndEscrowStateForReceivables: jest.fn().mockImplementation(({ reference }) => ({
        payments: paymentsMockData[reference] || [],
        escrowEvents: [],
      })),
      GetLastSyncedBlock: jest.fn(),
      GetSyncedBlock: jest.fn(),
    };

    erc20TransferableReceivable = new ERC20TransferableReceivablePaymentDetector({
      advancedLogic: mockAdvancedLogic,
      currencyManager,
      getSubgraphClient: jest.fn().mockImplementation(({}) => {
        return clientMock;
      }),
    });

    const graphRetriever = new TheGraphInfoRetriever(clientMock, CurrencyManager.getDefault());
    const allNetworkEvents = await graphRetriever.getReceivableEvents({
      paymentReference: shortReference,
      contractAddress: erc20LocalhostContractAddress,
      toAddress: '',
      eventName: PaymentTypes.EVENTS_NAMES.PAYMENT,
      paymentChain: paymentData.network,
    });

    const transferEvents = allNetworkEvents.paymentEvents;
    expect(transferEvents).toHaveLength(2);
    expect(transferEvents[0].amount).toEqual('400');
    expect(transferEvents[0].name).toEqual('payment');
    expect(transferEvents[0].parameters?.to).toEqual(utils.getAddress(paymentData.to));
    expect(transferEvents[0].parameters?.block).toEqual(9610470);

    expect(transferEvents[1].amount).toEqual('600');
    expect(transferEvents[1].name).toEqual('payment');
    expect(transferEvents[1].parameters?.to).toEqual(
      utils.getAddress('0x186e7fe6c34ea0eca7f9c2fd29651fc0443e3f30'),
    );
    expect(transferEvents[1].parameters?.block).toEqual(9610471);
  });
});
