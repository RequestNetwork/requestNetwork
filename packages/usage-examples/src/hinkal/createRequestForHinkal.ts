import { ethers } from 'ethers';
import { RequestNetwork, Types, Utils } from '@requestnetwork/request-client.js';
import { EthereumPrivateKeySignatureProvider } from '@requestnetwork/epk-signature';
import { CurrencyTypes } from '@requestnetwork/types';

// Example Data:
const currencyAddress = '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85'; // USDC
const currencyAmount = ethers.utils.parseUnits('0.01', 6).toBigInt();
const currentNetwork = 'sepolia' as CurrencyTypes.ChainName;
const currentCurrenyType = Types.RequestLogic.CURRENCY.ERC20;
const currentGateway = 'https://sepolia.gateway.request.network';
const payee = '0xA4faFa5523F63EE58aE7b56ad8EB5a344A19F266'; // some random address
const fee = '0';
const contentData = {
  reason: 'Hinkal Test',
  dueDate: '2025.06.16',
};

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
