import {
  AdvancedLogicTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import ETHFeeProxyDetector from '../../src/eth/fee-proxy-detector';

let ethFeeProxyDetector: ETHFeeProxyDetector;

const mockAdvancedLogic: AdvancedLogicTypes.IAdvancedLogic = {
  applyActionToExtensions(): any {
    return;
  },
  extensions: {
    feeProxyContractEth: {
      createAddPaymentAddressAction(): any {
        return;
      },
      createAddRefundAddressAction(): any {
        return;
      },
      createCreationAction(): any {
        return;
      },
      createAddFeeAction(): any {
        return;
      },
      supportedNetworks: ['private']
    },
    declarative: {
      createAddPaymentInstructionAction(): any {
        return;
      },
      createAddRefundInstructionAction(): any {
        return;
      },
    }
  },
};

/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('api/eth/fee-proxy-contract', () => {
  beforeEach(() => {
    ethFeeProxyDetector = new ETHFeeProxyDetector({
      advancedLogic: mockAdvancedLogic,
    });
  });

  it('can createExtensionsDataForCreation', async () => {
    const spy = jest.spyOn(
      mockAdvancedLogic.extensions.feeProxyContractEth,
      'createCreationAction',
    );

    await ethFeeProxyDetector.createExtensionsDataForCreation({
      paymentAddress: 'ethereum address',
      salt: 'ea3bc7caf64110ca',
    });

    expect(spy).toHaveBeenCalledWith({
      feeAddress: undefined,
      feeAmount: undefined,
      paymentAddress: 'ethereum address',
      refundAddress: undefined,
      salt: 'ea3bc7caf64110ca',
    });
  });

  it('can createExtensionsDataForCreation with fee amount and address', async () => {
    const spy = jest.spyOn(
      mockAdvancedLogic.extensions.feeProxyContractEth,
      'createCreationAction',
    );

    await ethFeeProxyDetector.createExtensionsDataForCreation({
      feeAddress: 'fee address',
      feeAmount: '2000',
      paymentAddress: 'ethereum address',
      salt: 'ea3bc7caf64110ca',
    });

    expect(spy).toHaveBeenCalledWith({
      feeAddress: 'fee address',
      feeAmount: '2000',
      paymentAddress: 'ethereum address',
      refundAddress: undefined,
      salt: 'ea3bc7caf64110ca',
    });
  });

  it('can createExtensionsDataForCreation without salt', async () => {
    const spy = jest.spyOn(
      mockAdvancedLogic.extensions.feeProxyContractEth,
      'createCreationAction',
    );

    await ethFeeProxyDetector.createExtensionsDataForCreation({
      paymentAddress: 'ethereum address',
      salt: 'ea3bc7caf64110ca',
    });

    // Can't check parameters since salt is generated in createExtensionsDataForCreation
    expect(spy).toHaveBeenCalled();
  });

  it('can createExtensionsDataForAddPaymentAddress', async () => {
    const spy = jest.spyOn(
      mockAdvancedLogic.extensions.feeProxyContractEth,
      'createAddPaymentAddressAction',
    );

    ethFeeProxyDetector.createExtensionsDataForAddPaymentAddress({
      paymentAddress: 'ethereum address',
    });

    expect(spy).toHaveBeenCalledWith({
      paymentAddress: 'ethereum address',
    });
  });

  it('can createExtensionsDataForAddRefundAddress', async () => {
    const spy = jest.spyOn(
      mockAdvancedLogic.extensions.feeProxyContractEth,
      'createAddRefundAddressAction',
    );

    ethFeeProxyDetector.createExtensionsDataForAddRefundAddress({
      refundAddress: 'ethereum address',
    });

    expect(spy).toHaveBeenCalledWith({
      refundAddress: 'ethereum address',
    });
  });

  it('can createExtensionsDataForAddPaymentInformation', async () => {
    const spy = jest.spyOn(
      mockAdvancedLogic.extensions.declarative,
      'createAddPaymentInstructionAction',
    );

    ethFeeProxyDetector.createExtensionsDataForAddPaymentInformation({
      paymentInfo: 'ethereum address',
    });

    expect(spy).toHaveBeenCalledWith({
      paymentInfo: 'ethereum address',
    });
  });

  it('can createExtensionsDataForAddRefundInformation', async () => {
    const spy = jest.spyOn(
      mockAdvancedLogic.extensions.declarative,
      'createAddRefundInstructionAction',
    );

    ethFeeProxyDetector.createExtensionsDataForAddRefundInformation({
      refundInfo: 'ethereum address',
    });

    expect(spy).toHaveBeenCalledWith({
      refundInfo: 'ethereum address',
    });
  });

  it('can createExtensionsDataForAddFeeInformation', async () => {
    const spy = jest.spyOn(
      mockAdvancedLogic.extensions.feeProxyContractEth,
      'createAddFeeAction',
    );

    ethFeeProxyDetector.createExtensionsDataForAddFeeInformation({
      feeAddress: 'ethereum address',
      feeAmount: '2000',
    });

    expect(spy).toHaveBeenCalledWith({
      feeAddress: 'ethereum address',
      feeAmount: '2000',
    });
  });

  it('should not throw when getBalance fail', async () => {
    expect(
      await ethFeeProxyDetector.getBalance({ currency: {network: 'private'}, extensions: {} } as RequestLogicTypes.IRequest),
    ).toEqual({
      balance: null,
      error: {
        code: PaymentTypes.BALANCE_ERROR_CODE.WRONG_EXTENSION,
        message: 'The request does not have the extension: pn-eth-fee-proxy-contract',
      },
      events: [],
    });
  });
});
