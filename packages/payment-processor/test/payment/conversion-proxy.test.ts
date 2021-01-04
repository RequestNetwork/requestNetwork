/* eslint-disable spellcheck/spell-checker */
import { Wallet } from 'ethers';
import { JsonRpcProvider } from 'ethers/providers';

import {
  ClientTypes,
  ExtensionTypes,
  IdentityTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
// import Utils from '@requestnetwork/utils';
// import { approveErc20, getErc20Balance } from '../../src/payment/erc20';
import { encodePayConversionErc20FeeRequest, payConversionErc20FeeProxyRequest } from '../../src/payment/erc20-conversion-fee-proxy';
// import { getRequestPaymentValues } from '../../src/payment/utils';
// import { bigNumberify } from 'ethers/utils';

// tslint:disable: no-unused-expression
// tslint:disable: await-promise

const erc20ContractAddress = '0x38cF23C52Bb4B13F051Aec09580a2dE845a7FA35';

const mnemonic = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat';
const paymentAddress = '0xf17f52151EbEF6C7334FAD080c5704D77216b732';
const provider = new JsonRpcProvider('http://localhost:8545');
const wallet = Wallet.fromMnemonic(mnemonic).connect(provider);

const validRequest: ClientTypes.IRequestData = {
  balance: {
    balance: '0',
    events: [],
  },
  contentData: {},
  creator: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: wallet.address,
  },
  currency: 'USD',
  currencyInfo: {
    type: RequestLogicTypes.CURRENCY.ISO4217,
    value: 'USD',
  },

  events: [],
  expectedAmount: '10000',
  extensions: {
    [PaymentTypes.PAYMENT_NETWORK_ID.ANY_ERC20_CONVERSION_FEE_PROXY_CONTRACT]: {
      events: [],
      id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_ERC20_CONVERSION_FEE_PROXY_CONTRACT,
      type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
      values: {
        paymentAddress,
        salt: 'salt',
      },
      version: '1.0',
    },
  },
  extensionsData: [],
  meta: {
    transactionManagerMeta: {},
  },
  pending: null,
  requestId: 'abcd',
  state: RequestLogicTypes.STATE.CREATED,
  timestamp: 0,
  version: '1.0',
};

describe('encodePayErc20FeeRequest', () => {
  // TODO TODO TODO
  // it.skip('handles USD to DAI', async () => {
  //   const values = await encodePayConversionErc20FeeRequest(validRequest, erc20ContractAddress, wallet);
  //   console.log('encodePayConversionErc20FeeRequest values');
  //   console.log(values);
  //   // expect(values.paymentAddress).toBe(paymentAddress);
  //   // expect(values.paymentReference).toBe('86dfbccad783599a');
  // });
});

describe('payConversionErc20FeeProxyRequest', () => {
  // TODO TODO TODO
  // it.skip('handles USD to DAI', async () => {
  //   const values = await payConversionErc20FeeProxyRequest(validRequest, erc20ContractAddress, wallet);
  //   console.log('payConversionErc20FeeProxyRequest values');
  //   console.log(values);
  //   // expect(values.paymentAddress).toBe(paymentAddress);
  //   // expect(values.paymentReference).toBe('86dfbccad783599a');
  // });
});

// describe('payErc20ProxyRequest', () => {
//   it('should throw an error if the request is not erc20', async () => {
//     const request = Utils.deepCopy(validRequest) as ClientTypes.IRequestData;
//     request.currencyInfo.type = RequestLogicTypes.CURRENCY.ETH;

//     await expect(payErc20ProxyRequest(request, wallet)).rejects.toThrowError(
//       'request cannot be processed, or is not an pn-erc20-proxy-contract request',
//     );
//   });

//   it('should throw an error if the currencyInfo has no value', async () => {
//     const request = Utils.deepCopy(validRequest);
//     request.currencyInfo.value = '';
//     await expect(payErc20ProxyRequest(request, wallet)).rejects.toThrowError(
//       'request cannot be processed, or is not an pn-erc20-proxy-contract request',
//     );
//   });

//   it('should throw an error if currencyInfo has no network', async () => {
//     const request = Utils.deepCopy(validRequest);
//     request.currencyInfo.network = '';
//     await expect(payErc20ProxyRequest(request, wallet)).rejects.toThrowError(
//       'request cannot be processed, or is not an pn-erc20-proxy-contract request',
//     );
//   });

//   it('should throw an error if request has no extension', async () => {
//     const request = Utils.deepCopy(validRequest);
//     request.extensions = [] as any;

//     await expect(payErc20ProxyRequest(request, wallet)).rejects.toThrowError(
//       'request cannot be processed, or is not an pn-erc20-proxy-contract request',
//     );
//   });

//   it('should consider override parameters', async () => {
//     const spy = jest.fn();
//     const originalSendTransaction = wallet.sendTransaction.bind(wallet);
//     wallet.sendTransaction = spy;
//     await payErc20ProxyRequest(validRequest, wallet, undefined, {
//       gasPrice: '20000000000',
//     });
//     expect(spy).toHaveBeenCalledWith({
//       data:
//         '0x0784bca30000000000000000000000009fbda871d559710256a2502a2517b794b482db40000000000000000000000000f17f52151ebef6c7334fad080c5704d77216b73200000000000000000000000000000000000000000000000000000000000000640000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000886dfbccad783599a000000000000000000000000000000000000000000000000',
//       gasPrice: '20000000000',
//       to: '0x2c2b9c9a4a25e24b174f26114e8926a9f2128fe4',
//       value: 0,
//     });
//     wallet.sendTransaction = originalSendTransaction;
//   });

//   it('should pay an ERC20 request', async () => {
//     // first approve the contract
//     const approvalTx = await approveErc20(validRequest, wallet);
//     await approvalTx.wait(1);

//     // get the balance to compare after payment

//     const balanceEthBefore = await wallet.getBalance();
//     const balanceErc20Before = await getErc20Balance(validRequest, wallet.address, provider);

//     const tx = await payErc20ProxyRequest(validRequest, wallet);
//     const confirmedTx = await tx.wait(1);

//     const balanceEthAfter = await wallet.getBalance();
//     const balanceErc20After = await getErc20Balance(validRequest, wallet.address, provider);

//     expect(confirmedTx.status).toBe(1);
//     expect(tx.hash).not.toBeUndefined();

//     expect(balanceEthAfter.lte(balanceEthBefore)).toBeTruthy(); // 'ETH balance should be lower'
//     expect(bigNumberify(balanceErc20After).lte(balanceErc20Before)).toBeTruthy(); // 'ERC20 balance should be lower'

//     expect(balanceErc20Before.toString()).toBe(
//       bigNumberify(balanceErc20After).add(validRequest.expectedAmount).toString(),
//     );
//   });
// });

