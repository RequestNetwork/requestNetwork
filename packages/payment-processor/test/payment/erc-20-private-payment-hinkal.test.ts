import { BigNumber, ethers, providers } from 'ethers';
import { RequestNetwork, Types, Utils } from '@requestnetwork/request-client.js';
import { CurrencyTypes } from '@requestnetwork/types';
import { EthereumPrivateKeySignatureProvider } from '@requestnetwork/epk-signature';
import {
  hinkal,
  payPrivateErc20FeeProxyRequestFromHinkal,
  payPrivateErc20ProxyRequestFromHinkal,
} from '../../src/payment/erc-20-private-payment-hinkal';
import { getErc20Balance } from '../../src/payment/erc20';

// Constants to configure the tests
export const currencyAddress = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // USDC
export const currencyAmount = ethers.utils.parseUnits('0.00001', 6).toBigInt();
export const currentNetwork: CurrencyTypes.ChainName = 'base';
export const currentCurrenyType = Types.RequestLogic.CURRENCY.ERC20;
export const currentGateway = 'https://sepolia.gateway.request.network';
export const payee = '0xA4faFa5523F63EE58aE7b56ad8EB5a344A19F266'; // some random address
export const fee = '0';
// Payer's private key (for signing and sending transactions)
const PAYER_PUBLIC_KEY = '0x44DC1e666C1ca6717849efE19eAC72AD83cFf5d2';
const PAYER_PRIVATE_KEY = '0x3abdcb3d6d6c302a7943715d0b975ae1377d7d1d188820f6cd57b6f13fb5b0e0';
// Blockchain RPC endpoint for the Base network
const RPC_URL = 'https://mainnet.base.org';
// Set Jest timeout for asynchronous operations (e.g., blockchain calls)
jest.setTimeout(1000000);

/**
 * Function to create a payment request for Hinkal.
 * This sets up the Request Network with payer and payee information.
 * @param payerWallet The wallet of the payer.
 * @param privateKey The private key of the payer (for signing).
 * @param type The payment network type (e.g., ERC20_PROXY_CONTRACT).
 * @returns A Promise that resolves to the request data with events.
 */
export const createRequestForHinkal = async (
  payerWallet: ethers.Wallet,
  privateKey: string,
  type: Types.Extension.PAYMENT_NETWORK_ID,
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

  let paymentNetwork;

  // Step 3: Define payment network configuration based on type
  if (type === Types.Extension.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT) {
    paymentNetwork = {
      id: type,
      parameters: {
        paymentNetworkName: currentNetwork,
        paymentAddress: payee,
      },
    };
  } else if (type === Types.Extension.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT) {
    paymentNetwork = {
      id: type,
      parameters: {
        paymentNetworkName: currentNetwork,
        paymentAddress: payee,
        feeAddress: payee,
        feeAmount: fee,
      },
    };
  }

  // step 4: Create Request Object
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
    paymentNetwork,
  };

  // Step 5: create & send request
  const request = await requestClient.createRequest(requestCreateParameters);
  const requestData = await request.waitForConfirmation();
  return requestData;
};

describe('ERC-20 Private Payments With Hinkal', () => {
  let provider: providers.Provider;
  let payer: ethers.Wallet;
  beforeAll(async () => {
    provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    payer = new ethers.Wallet(PAYER_PRIVATE_KEY, provider);
  });
  afterAll(async () => {
    hinkal.snapshotsClearInterval(); // Clear Hinkal's internal snapshots interval
    jest.clearAllTimers(); // Clear any pending Jest timers
  });
  it('ERC-20 Proxy: Privacy of a Sender - Payer is not equal to Origin/Sender of Transaction', async () => {
    const requestData = await createRequestForHinkal(
      payer,
      PAYER_PRIVATE_KEY,
      Types.Extension.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT,
    );
    const balanceErc20Before = await getErc20Balance(requestData, payee, provider);
    const tx = await payPrivateErc20ProxyRequestFromHinkal(requestData, payer);
    const balanceErc20After = await getErc20Balance(requestData, payee, provider);

    expect(tx.status).toBe(1);
    expect(tx.from).not.toBe(PAYER_PUBLIC_KEY);
    expect(BigNumber.from(balanceErc20Before).lt(BigNumber.from(balanceErc20After)));
  });
  it('ERC-20 Fee Proxy: Privacy of a Sender - Payer is not equal to Origin/Sender of Transaction', async () => {
    const requestData = await createRequestForHinkal(
      payer,
      PAYER_PRIVATE_KEY,
      Types.Extension.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT,
    );

    const balanceErc20Before = await getErc20Balance(requestData, payee, provider);
    const tx = await payPrivateErc20FeeProxyRequestFromHinkal(requestData, payer);
    const balanceErc20After = await getErc20Balance(requestData, payee, provider);

    expect(tx.status).toBe(1);
    expect(tx.from).not.toBe(PAYER_PUBLIC_KEY);
    expect(BigNumber.from(balanceErc20Before).lt(BigNumber.from(balanceErc20After)));
  });
});
