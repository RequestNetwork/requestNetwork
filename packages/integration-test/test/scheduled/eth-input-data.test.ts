import {
  EthInputDataPaymentDetector,
  PaymentNetworkFactory,
} from '@requestnetwork/payment-detection';
import { PaymentTypes, RequestLogicTypes } from '@requestnetwork/types';
import { CurrencyManager } from '@requestnetwork/currency';

import { mockAdvancedLogic } from './mocks';
import { Types, Utils } from '@requestnetwork/request-client.js';
import {
  ethInputDataCreationHash,
  localEthInputDataPaymentNetworkParams,
  payeeIdentity,
  payerIdentity,
  privateErc20Address,
  requestNetwork,
} from './fixtures';
import { createMockNativeTokenRequest, defaultPaymentDetectorOptions } from '../utils';

const ethInputContract = new EthInputDataPaymentDetector(defaultPaymentDetectorOptions);

describe('ETH Fee proxy detection test-suite', () => {
  it('can getBalance for a payment declared by the payee', async () => {
    const request = await requestNetwork.createRequest({
      paymentNetwork: localEthInputDataPaymentNetworkParams,
      requestInfo: ethInputDataCreationHash,
      signer: payeeIdentity,
    });

    let requestData = await request.declareReceivedPayment(
      '50000000000000000',
      'OK',
      payeeIdentity,
    );
    const declarationTimestamp = Utils.getCurrentTimestampInSecond();
    requestData = await new Promise((resolve): unknown => requestData.on('confirmed', resolve));

    const balance = await ethInputContract.getBalance({
      ...requestData,
      currency: {
        network: 'rinkeby',
        type: RequestLogicTypes.CURRENCY.ETH,
        value: privateErc20Address,
      },
    });
    expect(balance.error).toBeUndefined();
    expect(balance.balance).toBe('50000000000000000');
    expect(balance.events).toHaveLength(1);
    expect(balance.events[0].name).toBe('payment');
    expect(balance.events[0].amount).toBe('50000000000000000');
    expect(Math.abs(declarationTimestamp - (balance.events[0].timestamp ?? 0))).toBeLessThan(5);
  }, 20000);

  it('getBalance = 0 if the payer declared the payment', async () => {
    // Create a request
    const request = await requestNetwork.createRequest({
      paymentNetwork: localEthInputDataPaymentNetworkParams,
      requestInfo: ethInputDataCreationHash,
      signer: payeeIdentity,
    });

    // The payer declares a payment
    let requestData: Types.IRequestDataWithEvents = await request.declareSentPayment(
      '50000000000000000',
      'OK',
      payerIdentity,
    );
    requestData = await new Promise((resolve): unknown => requestData.on('confirmed', resolve));
    const balance = await ethInputContract.getBalance({
      ...requestData,
      currency: {
        network: 'private',
        type: RequestLogicTypes.CURRENCY.ETH,
        value: privateErc20Address,
      },
    });
    expect(balance.balance).toBe('0');
    expect(balance.events).toHaveLength(0);
  });
  describe('with a TheGraph Retriever', () => {
    it('getBalance of ETHFeeProxy request', async () => {
      const pnFactory = new PaymentNetworkFactory(mockAdvancedLogic, CurrencyManager.getDefault());
      const mockRequest = createMockNativeTokenRequest({
        network: 'matic',
        requestId: '01b3b6fe1ac1031f96d1c44714766be12fd3ef7047d2b7c04f9bd4b7ea928edc64',
        paymentAddress: '0x4E64C2d06d19D13061e62E291b2C4e9fe5679b93',
        salt: '4b297a41ff3b247a',
        feeAddress: '0x35d0e078755cd84d3e0656caab417dee1d7939c7',
        feeAmount: '0',
        nativeTokenCode: 'MATIC',
      });

      const detector = pnFactory.getPaymentNetworkFromRequest(mockRequest);
      expect(detector).not.toBeNull();
      const balance = await detector!.getBalance(mockRequest);

      expect(balance.balance).toBe('5000000000000000000'); // 5 MATIC
      expect(balance.events).toHaveLength(1);
      expect(balance.events[0].name).toBe('payment');
      const params = balance.events[0].parameters as PaymentTypes.ETHPaymentNetworkEventParameters;
      expect(params?.to).toBe('0x4E64C2d06d19D13061e62E291b2C4e9fe5679b93');
      expect(balance.events[0].amount).toBe('5000000000000000000');
      expect(balance.events[0].timestamp).toBe(1679673933);
    });
    it('getBalance=0 for an ETHFeeProxy request paid with conversion', async () => {
      const pnFactory = new PaymentNetworkFactory(mockAdvancedLogic, CurrencyManager.getDefault());
      const mockRequest = createMockNativeTokenRequest({
        network: 'matic',
        requestId: '01814304b39265cbf0c2abb4f3c7e8432d1e2c8779be6022e545d25f95144360e0',
        paymentAddress: '0x4E64C2d06d19D13061e62E291b2C4e9fe5679b93',
        salt: 'b3f2e478374bff64',
        feeAddress: '0x35d0e078755cd84d3e0656caab417dee1d7939c7',
        feeAmount: '0',
        nativeTokenCode: 'MATIC',
      });

      const detector = pnFactory.getPaymentNetworkFromRequest(mockRequest);
      expect(detector).not.toBeNull();
      const balance = await detector!.getBalance(mockRequest);

      // No payment, although there is a MATIC payment with conversion for the same reference & payment address
      expect(balance.balance).toBe('0');
      expect(balance.events).toHaveLength(0);
    });
  });
});
