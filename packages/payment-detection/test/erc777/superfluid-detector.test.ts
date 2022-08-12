import {
  AdvancedLogicTypes,
  ExtensionTypes,
  IdentityTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import { SuperFluidPaymentDetector } from '../../src/erc777/superfluid-detector';
import { mockTransferEventsByMonth } from './mocks';

let superfluidPaymentDetector: SuperFluidPaymentDetector;

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
    feeProxyContractErc20: {
      supportedNetworks: ['mainnet', 'private'],
      createAddPaymentAddressAction,
      createAddRefundAddressAction,
      createCreationAction,
      createAddFeeAction,
      // inherited from declarative
      createAddPaymentInstructionAction,
      createAddRefundInstructionAction,
    },
  },
};
const baseRequestData = {
  creator: { type: IdentityTypes.TYPE.ETHEREUM_ADDRESS, value: '0x2' },
  currency: {
    network: 'private',
    type: RequestLogicTypes.CURRENCY.ERC20,
    value: '0x9FBDa871d559710256a2502A2517b794B482Db40', // local ERC20 token
  },
  events: [],
  extensionsData: [],
  requestId: '0x1',
  state: RequestLogicTypes.STATE.CREATED,
  timestamp: 0,
  version: '0.2',
  expectedAmount: '1000',
};
const mockMasterRequest: RequestLogicTypes.IRequest = {
  ...baseRequestData,
  requestId: '0xmaster',
  extensions: {
    [ExtensionTypes.ID.PAYMENT_NETWORK_ERC777_STREAM]: {
      events: [],
      id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC777_STREAM,
      type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
      values: {
        feeAddress: '0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef',
        feeAmount: '5',
        paymentAddress: '0xf17f52151EbEF6C7334FAD080c5704D77216b732',
        refundAddress: '0xrefundAddress',
        salt: 'abcd',
      },
      version: '0',
    },
  },
};
// @ts-ignore
const mockFirstSubRequest: RequestLogicTypes.IRequest = {
  ...baseRequestData,
  requestId: '0xsubseq1',
  extensions: {
    [ExtensionTypes.ID.PAYMENT_NETWORK_ERC777_STREAM]: {
      events: [],
      id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC777_STREAM,
      type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
      values: {
        feeAddress: '0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef',
        feeAmount: '5',
        paymentAddress: '0xf17f52151EbEF6C7334FAD080c5704D77216b732',
        refundAddress: '0xrefundAddress',
        salt: 'abcd',
        masterRequestId: '0xmaster',
        previousRequestId: '0xmaster',
        recurrenceNumber: 1,
      },
      version: '0',
    },
  },
};
// @ts-ignore
const mockSecondSubRequest: RequestLogicTypes.IRequest = {
  ...baseRequestData,
  requestId: '0xsubseq2',
  extensions: {
    [ExtensionTypes.ID.PAYMENT_NETWORK_ERC777_STREAM]: {
      events: [],
      id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC777_STREAM,
      type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
      values: {
        feeAddress: '0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef',
        feeAmount: '5',
        paymentAddress: '0xf17f52151EbEF6C7334FAD080c5704D77216b732',
        refundAddress: '0xrefundAddress',
        salt: 'abcd',
        masterRequestId: '0xmaster1',
        previousRequestId: '0xsubseq1',
        recurrenceNumber: 1,
      },
      version: '0',
    },
  },
};

describe.only('superfluid balance computation', () => {
  beforeEach(() => {
    superfluidPaymentDetector = new SuperFluidPaymentDetector({ advancedLogic: mockAdvancedLogic });
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('detects correct balance on master request in the middle of first month', async () => {
    jest
      .spyOn(superfluidPaymentDetector as any, 'getEvents')
      .mockImplementation(
        mockTransferEventsByMonth(1, parseInt(mockMasterRequest.expectedAmount.toString())),
      );
    const balance = await superfluidPaymentDetector.getBalance(mockMasterRequest);
    expect(balance.balance).toEqual('500');
  });
  it('master request has full balance when observing in second month', async () => {
    jest
      .spyOn(superfluidPaymentDetector as any, 'getEvents')
      .mockImplementation(
        mockTransferEventsByMonth(2, parseInt(mockMasterRequest.expectedAmount.toString())),
      );
    const balance = await superfluidPaymentDetector.getBalance(mockMasterRequest);
    expect(balance.balance).toEqual('1000');
  });
  //   it('second request has 0 balance when observing in first month');
  //   it('second request has correct balance in the middle of second month');
  //   it('second request has full balance in the middle of third month');
  //   it('third request has 0 balance in second month');
  //   it('third request has good balance in third month');
});
