import {
  AdvancedLogicTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import ETHFeeProxyDetector from '../../src/eth/fee-proxy-detector';

let ethFeeProxyContract: ETHFeeProxyDetector;

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
  },
};

/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('api/eth/fee-proxy-contract', () => {
  beforeEach(() => {
    ethFeeProxyContract = new ETHFeeProxyDetector({
      advancedLogic: mockAdvancedLogic,
    });
  });

  it('can createExtensionsDataForCreation', async () => {
    const spy = jest.spyOn(
      mockAdvancedLogic.extensions.feeProxyContractEth,
      'createCreationAction',
    );

    await ethFeeProxyContract.createExtensionsDataForCreation({
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

    await ethFeeProxyContract.createExtensionsDataForCreation({
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

    await ethFeeProxyContract.createExtensionsDataForCreation({
      paymentAddress: 'ethereum address',
      salt: 'ea3bc7caf64110ca',
    });

    // Can't check parameters since salt is generated in createExtensionsDataForCreation
    expect(spy).toHaveBeenCalled();
  });

  it('can createExtensionsDataForAddPaymentInformation', async () => {
    const spy = jest.spyOn(
      mockAdvancedLogic.extensions.feeProxyContractEth,
      'createAddPaymentAddressAction',
    );

    ethFeeProxyContract.createExtensionsDataForAddPaymentInformation({
      paymentAddress: 'ethereum address',
    });

    expect(spy).toHaveBeenCalledWith({
      paymentAddress: 'ethereum address',
    });
  });

  it('can createExtensionsDataForAddRefundInformation', async () => {
    const spy = jest.spyOn(
      mockAdvancedLogic.extensions.feeProxyContractEth,
      'createAddRefundAddressAction',
    );

    ethFeeProxyContract.createExtensionsDataForAddRefundInformation({
      refundAddress: 'ethereum address',
    });

    expect(spy).toHaveBeenCalledWith({
      refundAddress: 'ethereum address',
    });
  });

  it('can createExtensionsDataForAddFeeInformation', async () => {
    const spy = jest.spyOn(
      mockAdvancedLogic.extensions.feeProxyContractEth,
      'createAddFeeAction',
    );

    ethFeeProxyContract.createExtensionsDataForAddFeeInformation({
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
      await ethFeeProxyContract.getBalance({ currency: {network: 'private'}, extensions: {} } as RequestLogicTypes.IRequest),
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
