// import {
//   IdentityTypes,
//   PaymentTypes,
//   SignatureProviderTypes,
//   SignatureTypes,
// } from '@requestnetwork/types';
// import { AdvancedLogic } from '@requestnetwork/advanced-logic';
// import Utils from '@requestnetwork/utils';
// import RequestNetwork from '../src/api/request-network';

// import MockDataAccess from '../src/mock-data-access';
// import MockStorage from '../src/mock-storage';

// const signatureParametersPayee: SignatureTypes.ISignatureParameters = {
//   method: SignatureTypes.METHOD.ECDSA,
//   privateKey: '0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3',
// };
// const signatureParametersPayer: SignatureTypes.ISignatureParameters = {
//   method: SignatureTypes.METHOD.ECDSA,
//   privateKey: '0xae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f',
// };
// const payeeIdentity: IdentityTypes.IIdentity = {
//   type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
//   value: '0x627306090abab3a6e1400e9345bc60c78a8bef57',
// };
// const payerIdentity: IdentityTypes.IIdentity = {
//   type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
//   value: '0xf17f52151ebef6c7334fad080c5704d77216b732',
// };

// const fakeSignatureProvider: SignatureProviderTypes.ISignatureProvider = {
//   sign: (data: any, signer: IdentityTypes.IIdentity): any => {
//     if (signer.value === payeeIdentity.value) {
//       return Utils.signature.sign(data, signatureParametersPayee);
//     } else {
//       return Utils.signature.sign(data, signatureParametersPayer);
//     }
//   },
//   supportedIdentityTypes: [IdentityTypes.TYPE.ETHEREUM_ADDRESS],
//   supportedMethods: [SignatureTypes.METHOD.ECDSA],
// };

// jest.mock('@requestnetwork/payment-detection', () => {
//   const original = jest.requireActual('@requestnetwork/payment-detection');
//   return {
//     ...original,
//     PaymentNetworkFactory: {
//       createPaymentNetwork() {
//         return new original.DeclarativePaymentNetwork({
//           advancedLogic: new AdvancedLogic(),
//         });
//       },
//       getPaymentNetworkFromRequest() {
//         return new original.DeclarativePaymentNetwork({
//           advancedLogic: new AdvancedLogic(),
//         });
//       },
//     },
//   };
// });

// describe('', () => {
//   it('', async () => {
//     //jest.spyOn(Request.prototype, 'refreshBalance').mockImplementation(jest.fn());
//     const storage = new MockStorage();
//     const dataAccess = new MockDataAccess(storage);

//     const requestNetwork = new RequestNetwork(dataAccess, fakeSignatureProvider);

//     const request = await requestNetwork.createRequest({
//       requestInfo: {
//         currency: 'BTC',
//         expectedAmount: '100000',
//         payee: payeeIdentity,
//         payer: payerIdentity,
//       },
//       signer: payeeIdentity,
//       paymentNetwork: {
//         id: PaymentTypes.PAYMENT_NETWORK_ID.BITCOIN_ADDRESS_BASED,
//         parameters: {
//           // eslint-disable-next-line spellcheck/spell-checker
//           paymentAddress: '1FersucwSqufU26w9GrGz9M3KcwuNmy6a9',
//         },
//       },
//     });
//     await request.waitForConfirmation();
//     const acceptedRequest = await request.accept(payerIdentity);
//     await new Promise((resolve, reject) => {
//       acceptedRequest.on('confirmed', resolve);
//       acceptedRequest.on('error', reject);
//     });
//   }, 5000);
// });
