import { AdvancedLogicTypes, PaymentTypes, RequestLogicTypes } from '@requestnetwork/types';
import { EthFeeProxyPaymentDetector } from '../../src/eth/fee-proxy-detector';
import TheGraphInfoRetriever from '../../src/erc20/thegraph-info-retriever';
import { EVENTS_NAMES } from '@requestnetwork/types/dist/payment-types';

let ethFeeProxyDetector: EthFeeProxyPaymentDetector;

const createAddPaymentAddressAction = jest.fn();
const createAddRefundAddressAction = jest.fn();
const createCreationAction = jest.fn();
const createAddFeeAction = jest.fn();
const createAddPaymentInstructionAction = jest.fn();
const createAddRefundInstructionAction = jest.fn();

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
      supportedNetworks: ['private'],
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

  it('should get subgraph payment by reference from ethFeeProxy contract', async () => {
    const paymentData = {
      reference: "0x25aea246d7890367ae577e1857c36ec2ad4673bab27bcd04a3c87c716a8cdd14",
      txHash: "0xcd67341254e105b80cbb6e53e4a767f9ae81f25c7bd9611f9837266a1c4b63cd",
      from: "0xb9e27497ba98c31af7620cbb1d964644838a6353",
      to: "0xb052f92efba37206f51548d9e8a1ecdb1bc05dea",
      network: "rinkeby"
    }
    const graphRetriever = new TheGraphInfoRetriever(
      paymentData.reference,
      "0xc6e23a20c0a1933acc8e30247b5d1e2215796c1f",
      null,
      paymentData.from,
      EVENTS_NAMES.PAYMENT,
      paymentData.network
    )

    const transferEvents = await graphRetriever.getTransferEvents();

    expect(transferEvents).toHaveLength(1);

  })

  // it('should get balance from subgraph for ethFeeProxy', async () => {
  // });
});
