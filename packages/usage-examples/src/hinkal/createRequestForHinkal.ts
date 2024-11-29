import { ethers } from 'ethers';
import { RequestNetwork, Types, Utils } from '@requestnetwork/request-client.js';
import { EthereumPrivateKeySignatureProvider } from '@requestnetwork/epk-signature';
import {
  contentData,
  currencyAddress,
  currencyAmount,
  currentCurrenyType,
  currentGateway,
  currentNetwork,
  fee,
  payee,
} from './hinkalRequestData';

/**
 * Creates a payment request with the parameters specified in './hinkalRequestData.ts'
 * used by testPayErc20FeeProxyRequestHinkal.ts
 * @param payerWallet the wallet used by the payer
 * @param privateKey the private key of the user creating the request
 * @returns Newly created request
 */
export const createRequestForHinkal = async (
  payerWallet: ethers.Wallet,
  privateKey: string,
): Promise<Types.IRequestDataWithEvents> => {
  // step 1: Create Signature Provider
  const epkSignatureProvider = new EthereumPrivateKeySignatureProvider({
    method: Types.Signature.METHOD.ECDSA,
    privateKey: privateKey,
  });
  // step 2: create Request Network
  const requestClient = new RequestNetwork({
    nodeConnectionConfig: {
      baseURL: currentGateway,
    },
    signatureProvider: epkSignatureProvider,
  });

  // step 3: Create Request Object
  const requestCreateParameters: Types.ICreateRequestParameters = {
    requestInfo: {
      currency: {
        type: currentCurrenyType,
        value: currencyAddress,
        network: currentNetwork,
      },
      payee: {
        type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
        value: payee,
      },
      payer: {
        type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
        value: payerWallet.address,
      },
      expectedAmount: currencyAmount.toString(),
      timestamp: Utils.getCurrentTimestampInSecond(),
    },
    signer: {
      type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
      value: payerWallet.address,
    },
    paymentNetwork: {
      id: Types.Extension.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT,
      parameters: {
        paymentNetworkName: currentNetwork,
        paymentAddress: payee,
        feeAddress: payee,
        feeAmount: fee,
      },
    },
    contentData,
  };

  // Step 4: create & send request
  const request = await requestClient.createRequest(requestCreateParameters);
  const requestData = await request.waitForConfirmation();
  return requestData;
};
