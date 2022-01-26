import { IdentityTypes, PaymentTypes } from '@requestnetwork/types';
import { RequestNetwork, Types } from '@requestnetwork/request-client.js';
import { EthereumPrivateKeySignatureProvider } from '@requestnetwork/epk-signature';

export const httpConfig = {
  getConfirmationDeferDelay: 1000,
  getConfirmationRetryDelay: 500,
};
export const signatureProvider = new EthereumPrivateKeySignatureProvider({
  method: Types.Signature.METHOD.ECDSA,
  privateKey: '0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3',
});
signatureProvider.addSignatureParameters({
  method: Types.Signature.METHOD.ECDSA,
  privateKey: '0xae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f',
});

export const privateErc20Address = '0x9FBDa871d559710256a2502A2517b794B482Db40';
export const DAITokenAddress = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
export const FAUAddress = '0xFab46E002BbF0b4509813474841E0716E6730136';

export const requestNetwork = new RequestNetwork({ httpConfig, signatureProvider });

export const payeeIdentity: IdentityTypes.IIdentity = {
  type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
  value: '0x627306090abab3a6e1400e9345bc60c78a8bef57',
};
export const payerIdentity: IdentityTypes.IIdentity = {
  type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
  value: '0xf17f52151ebef6c7334fad080c5704d77216b732',
};

export const erc20requestCreationHash: Types.IRequestInfo = {
  currency: {
    network: 'private',
    type: Types.RequestLogic.CURRENCY.ERC20,
    value: privateErc20Address,
  },
  expectedAmount: '10',
  payee: payeeIdentity,
  payer: payerIdentity,
};

export const ethInputDataCreationHash: Types.IRequestInfo = {
  currency: {
    network: 'private',
    type: Types.RequestLogic.CURRENCY.ETH,
    value: privateErc20Address, // TODO: Change to ETH address
  },
  expectedAmount: '100000000000000000',
  payee: payeeIdentity,
  payer: payerIdentity,
};

export const localErc20PaymentNetworkParams: PaymentTypes.IPaymentNetworkCreateParameters = {
  id: PaymentTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT,
  parameters: {
    paymentAddress: '0xf17f52151EbEF6C7334FAD080c5704D77216b732',
  },
};

export const localEthInputDataPaymentNetworkParams: PaymentTypes.IPaymentNetworkCreateParameters = {
  id: PaymentTypes.PAYMENT_NETWORK_ID.ETH_INPUT_DATA,
  parameters: {
    paymentAddress: '0xf17f52151EbEF6C7334FAD080c5704D77216b732',
  },
};
