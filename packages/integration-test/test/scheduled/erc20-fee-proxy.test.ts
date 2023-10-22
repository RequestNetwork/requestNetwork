import { CurrencyManager } from '@requestnetwork/currency';
import { PaymentNetworkFactory } from '@requestnetwork/payment-detection';
import { CurrencyTypes, PaymentTypes, RequestLogicTypes } from '@requestnetwork/types';
import { Types, Utils } from '@requestnetwork/request-client.js';

import { mockAdvancedLogic } from './mocks.js';
import {
  erc20requestCreationHash,
  localErc20PaymentNetworkParams,
  payeeIdentity,
  payerIdentity,
  privateErc20Address,
  requestNetwork,
} from './fixtures.js';
import { createMockErc20FeeRequest } from '../utils.js';

const pnFactory = new PaymentNetworkFactory(mockAdvancedLogic, CurrencyManager.getDefault());

const paidRequest = {
  network: 'matic' as CurrencyTypes.EvmChainName,
  requestId: '014bcd076791fb915af457df1d3f26c81ff66f7e278e4a18f0e48a1705572a6306',
  paymentAddress: '0x4E64C2d06d19D13061e62E291b2C4e9fe5679b93',
  salt: '8c5ea6f8b4a14fe0',
  tokenAddress: '0x282d8efce846a88b159800bd4130ad77443fa1a1', // OCEAN
  feeAddress: '0x35d0e078755cd84d3e0656caab417dee1d7939c7',
  feeAmount: '1000000000000000',
};

describe('ERC20 Fee Proxy detection test-suite (with a TheGraph Retriever)', () => {
  const getFeeProxyDetector = (
    request: RequestLogicTypes.IRequest,
  ): PaymentTypes.IPaymentNetwork => {
    const erc20FeeProxy = pnFactory.getPaymentNetworkFromRequest(request);
    expect(erc20FeeProxy).toBeDefined();
    return erc20FeeProxy!;
  };
  it('can getBalance on a mainnet request', async () => {
    const mockRequest = createMockErc20FeeRequest({
      network: 'mainnet',
      requestId: '016d4cf8006982f7d91a437f8c72700aa62767de00a605133ee5f84ad8d224ba04',
      paymentAddress: '0x4E64C2d06d19D13061e62E291b2C4e9fe5679b93',
      salt: '8097784e131ee627',
      tokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
      feeAddress: '0x35d0e078755cd84d3e0656caab417dee1d7939c7',
      feeAmount: '10',
    });

    const erc20FeeProxy = getFeeProxyDetector(mockRequest);
    const balance = await erc20FeeProxy.getBalance(mockRequest);

    expect(balance.balance).toBe('1000000000000000000');
    expect(balance.events).toHaveLength(1);
    expect(balance.events[0].name).toBe('payment');
    const params = balance.events[0].parameters as PaymentTypes.IERC20FeePaymentEventParameters;
    expect(params?.to).toBe('0x4E64C2d06d19D13061e62E291b2C4e9fe5679b93');
    expect(balance.events[0].amount).toBe('1000000000000000000');
    expect(balance.events[0].timestamp).toBe(1599070058);
  });

  it('can getBalance on a matic request', async () => {
    const mockRequest = createMockErc20FeeRequest(paidRequest);

    const erc20FeeProxy = getFeeProxyDetector(mockRequest);
    const balance = await erc20FeeProxy.getBalance(mockRequest);

    expect(balance.balance).toBe('1000000000000000000');
    expect(balance.events).toHaveLength(1);
    expect(balance.events[0].name).toBe('payment');
    const params = balance.events[0].parameters as PaymentTypes.IERC20FeePaymentEventParameters;
    expect(params.to).toBe('0x4E64C2d06d19D13061e62E291b2C4e9fe5679b93');
    expect(balance.events[0].amount).toBe('1000000000000000000');
    expect(balance.events[0].timestamp).toBe(1621953168);
  });

  it('getBalance = 0 if a payment is made with another token', async () => {
    const mockRequest = createMockErc20FeeRequest({
      ...paidRequest,
      tokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F', // The request is paid with another token
    });

    const erc20FeeProxy = getFeeProxyDetector(mockRequest);
    const balance = await erc20FeeProxy.getBalance(mockRequest);

    expect(balance.balance).toBe('0');
    expect(balance.events).toHaveLength(0);
  });

  it('can getBalance for a payment declared by the payee', async () => {
    // Create a request
    const request = await requestNetwork.createRequest({
      paymentNetwork: localErc20PaymentNetworkParams,
      requestInfo: erc20requestCreationHash,
      signer: payeeIdentity,
    });

    // The payee declares the payment
    let requestData = await request.declareReceivedPayment('1', 'OK', payeeIdentity, '0x1234');
    const declarationTimestamp = Utils.getCurrentTimestampInSecond();
    requestData = await new Promise((resolve): any => requestData.on('confirmed', resolve));
    const updatedRequest: RequestLogicTypes.IRequest = {
      ...requestData,
      currency: {
        network: 'private',
        type: RequestLogicTypes.CURRENCY.ERC20,
        value: privateErc20Address,
      },
    };

    const erc20FeeProxy = getFeeProxyDetector(updatedRequest);
    const balance = await erc20FeeProxy.getBalance(updatedRequest);

    expect(balance.balance).toBe('1');
    expect(balance.events).toHaveLength(1);
    expect(balance.events[0].name).toBe('payment');
    expect(balance.events[0].amount).toBe('1');
    expect(Math.abs(declarationTimestamp - (balance.events[0].timestamp ?? 0))).toBeLessThan(5);
  }, 15000);

  it('getBalance = 0 if the payer declared the payment', async () => {
    // Create a request
    const request = await requestNetwork.createRequest({
      paymentNetwork: localErc20PaymentNetworkParams,
      requestInfo: erc20requestCreationHash,
      signer: payeeIdentity,
    });

    // The payer declares a payment
    let requestData: Types.IRequestDataWithEvents = await request.declareSentPayment(
      '1',
      'OK',
      payerIdentity,
    );
    requestData = await new Promise((resolve): any => requestData.on('confirmed', resolve));
    const updatedRequest: RequestLogicTypes.IRequest = {
      ...requestData,
      currency: {
        network: 'private',
        type: RequestLogicTypes.CURRENCY.ERC20,
        value: privateErc20Address,
      },
    };

    const erc20FeeProxy = getFeeProxyDetector(updatedRequest);
    const balance = await erc20FeeProxy.getBalance(updatedRequest);
    expect(balance.balance).toBe('0');
    expect(balance.events).toHaveLength(0);
  }, 15000);
});
