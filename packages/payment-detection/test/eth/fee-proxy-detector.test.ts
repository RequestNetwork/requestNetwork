import { AdvancedLogicTypes, PaymentTypes, RequestLogicTypes } from '@requestnetwork/types';
import { EthFeeProxyPaymentDetector } from '../../src/eth/fee-proxy-detector';
import TheGraphInfoRetriever from '../../src/erc20/thegraph-info-retriever';
import PaymentReferenceCalculator from '../../src/payment-reference-calculator';
import { utils } from 'ethers';

let ethFeeProxyDetector: EthFeeProxyPaymentDetector;

const createAddPaymentAddressAction = jest.fn();
const createAddRefundAddressAction = jest.fn();
const createCreationAction = jest.fn();
const createAddFeeAction = jest.fn();
const createAddPaymentInstructionAction = jest.fn();
const createAddRefundInstructionAction = jest.fn();

const ETH_FEE_PROXY_CONTRACT = "0xc6e23a20c0a1933acc8e30247b5d1e2215796c1f";
const ETH_CONVERSION_PROXY_CONTRACT = "0xca3353a15fcb5c83a1ff64bff055781ac5c4d2f4";

const mockAdvancedLogic: AdvancedLogicTypes.IAdvancedLogic = {
  applyActionToExtensions(): any {
    return;
  },
  extensions: {
    feeProxyContractEth: {
      createAddPaymentAddressAction,
      createAddRefundAddressAction,
      createCreationAction,
      createAddFeeAction,
      supportedNetworks: ['private', 'rinkeby'],
      // inherited from declarative
      createAddPaymentInstructionAction,
      createAddRefundInstructionAction,
    },
  },
};

/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('api/eth/fee-proxy-contract', () => {
  beforeEach(() => {
    ethFeeProxyDetector = new EthFeeProxyPaymentDetector({
      advancedLogic: mockAdvancedLogic,
    });
  });

  it('can createExtensionsDataForCreation', async () => {
    await ethFeeProxyDetector.createExtensionsDataForCreation({
      paymentAddress: 'ethereum address',
      salt: 'ea3bc7caf64110ca',
    });

    expect(createCreationAction).toHaveBeenCalledWith({
      feeAddress: undefined,
      feeAmount: undefined,
      paymentAddress: 'ethereum address',
      refundAddress: undefined,
      salt: 'ea3bc7caf64110ca',
    });
  });

  it('can createExtensionsDataForCreation with fee amount and address', async () => {
    await ethFeeProxyDetector.createExtensionsDataForCreation({
      feeAddress: 'fee address',
      feeAmount: '2000',
      paymentAddress: 'ethereum address',
      salt: 'ea3bc7caf64110ca',
    });

    expect(createCreationAction).toHaveBeenCalledWith({
      feeAddress: 'fee address',
      feeAmount: '2000',
      paymentAddress: 'ethereum address',
      refundAddress: undefined,
      salt: 'ea3bc7caf64110ca',
    });
  });

  it('can createExtensionsDataForCreation without salt', async () => {
    await ethFeeProxyDetector.createExtensionsDataForCreation({
      paymentAddress: 'ethereum address',
      salt: 'ea3bc7caf64110ca',
    });

    // Can't check parameters since salt is generated in createExtensionsDataForCreation
    expect(createCreationAction).toHaveBeenCalled();
  });

  it('can createExtensionsDataForAddPaymentAddress', async () => {
    ethFeeProxyDetector.createExtensionsDataForAddPaymentAddress({
      paymentAddress: 'ethereum address',
    });

    expect(createAddPaymentAddressAction).toHaveBeenCalledWith({
      paymentAddress: 'ethereum address',
    });
  });

  it('can createExtensionsDataForAddRefundAddress', async () => {
    ethFeeProxyDetector.createExtensionsDataForAddRefundAddress({
      refundAddress: 'ethereum address',
    });

    expect(createAddRefundAddressAction).toHaveBeenCalledWith({
      refundAddress: 'ethereum address',
    });
  });

  it('can createExtensionsDataForAddPaymentInformation', async () => {
    ethFeeProxyDetector.createExtensionsDataForAddPaymentInformation({
      paymentInfo: 'ethereum address',
    });

    expect(createAddPaymentInstructionAction).toHaveBeenCalledWith({
      paymentInfo: 'ethereum address',
    });
  });

  it('can createExtensionsDataForAddRefundInformation', async () => {
    ethFeeProxyDetector.createExtensionsDataForAddRefundInformation({
      refundInfo: 'ethereum address',
    });

    expect(createAddRefundInstructionAction).toHaveBeenCalledWith({
      refundInfo: 'ethereum address',
    });
  });

  it('can createExtensionsDataForAddFeeInformation', async () => {
    ethFeeProxyDetector.createExtensionsDataForAddFeeInformation({
      feeAddress: 'ethereum address',
      feeAmount: '2000',
    });

    expect(createAddFeeAction).toHaveBeenCalledWith({
      feeAddress: 'ethereum address',
      feeAmount: '2000',
    });
  });

  it('should not throw when getBalance fail', async () => {
    expect(
      await ethFeeProxyDetector.getBalance({
        currency: { network: 'private' },
        extensions: {},
      } as RequestLogicTypes.IRequest),
    ).toEqual({
      balance: null,
      error: {
        code: PaymentTypes.BALANCE_ERROR_CODE.WRONG_EXTENSION,
        message: 'The request does not have the extension: pn-eth-fee-proxy-contract',
      },
      events: [],
    });
  });

  it('should get payment event from ethFeeProxy via subgraph', async () => {
    const paymentData = {
      reference: "0x6c93723bc5f82e6fbb2ea994bf0fb572fa19f7a2a3146065e21752b95668efe5",
      txHash: "0x3e2d6cc2534b1d340ba2954f34e6cc819d6da64ff76863ea89c6d34b15d13c97",
      from: "0x186e7fe6c34ea0eca7f9c2fd29651fc0443e3f29",
      to: "0x5000ee9fb9c96a2a09d8efb695ac21d6c429ff11",
      network: "rinkeby",
      salt: "0ee84db293a752c6",
      amount: "30000000000000",
      requestId: "0188791633ff0ec72a7dbdefb886d2db6cccfa98287320839c2f173c7a4e3ce7e1",
      block: 9606098
    }
    const paymentReference = PaymentReferenceCalculator.calculate(paymentData.requestId, paymentData.salt, paymentData.to);
    const onChainReference = utils.keccak256(`0x${paymentReference}`)
    expect(onChainReference).toEqual(paymentData.reference);

    const graphRetriever = new TheGraphInfoRetriever(
      paymentReference,
      ETH_FEE_PROXY_CONTRACT,
      null,
      paymentData.to,
      PaymentTypes.EVENTS_NAMES.PAYMENT,
      paymentData.network,
    )
    const transferEvents = await graphRetriever.getTransferEvents();
    expect(transferEvents).toHaveLength(1);
    expect(transferEvents[0].amount).toEqual("30000000000000");
    expect(transferEvents[0].name).toEqual("payment");
    expect(transferEvents[0].parameters?.to).toEqual(paymentData.to);
    expect(transferEvents[0].parameters?.txHash).toEqual(paymentData.txHash);
    expect(transferEvents[0].parameters?.block).toEqual(paymentData.block);
  })

  it('should get payment event from ethFeeConversionProxy via subgraph', async () => {
    const paymentData = {
      reference: "0x6c93723bc5f82e6fbb2ea994bf0fb572fa19f7a2a3146065e21752b95668efe5",
      txHash: "0x2f7b4752aa259166c038cd9073056c5979760cf0eea55d093fca2095c229313b",
      from: "0x186e7fe6c34ea0eca7f9c2fd29651fc0443e3f29",
      to: "0x5000ee9fb9c96a2a09d8efb695ac21d6c429ff11",
      network: "rinkeby",
      salt: "0ee84db293a752c6",
      amount: "7000",
      block: 9610470,
      requestId: "0188791633ff0ec72a7dbdefb886d2db6cccfa98287320839c2f173c7a4e3ce7e1"
    }

    const shortReference = PaymentReferenceCalculator.calculate(paymentData.requestId, paymentData.salt, paymentData.to);
    const onChainReference = utils.keccak256(`0x${shortReference}`)
    expect(onChainReference).toEqual(paymentData.reference);

    const graphRetriever = new TheGraphInfoRetriever(
      shortReference,
      ETH_CONVERSION_PROXY_CONTRACT,
      null,
      paymentData.to,
      PaymentTypes.EVENTS_NAMES.PAYMENT,
      paymentData.network
    );
    const transferEvents = await graphRetriever.getTransferEvents();
    expect(transferEvents).toHaveLength(1);
    expect(transferEvents[0].amount).toEqual(paymentData.amount);
    expect(transferEvents[0].parameters?.to).toEqual(paymentData.to);
    expect(transferEvents[0].parameters?.txHash).toEqual(paymentData.txHash);
    expect(transferEvents[0].parameters?.block).toEqual(paymentData.block);
  })

});
