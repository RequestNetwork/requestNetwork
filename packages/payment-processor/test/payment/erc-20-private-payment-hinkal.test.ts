import { BigNumber, ethers, providers, Wallet } from 'ethers';
import { RequestNetwork, Types, Utils } from '@requestnetwork/request-client.js';
import { CurrencyTypes } from '@requestnetwork/types';
import { EthereumPrivateKeySignatureProvider } from '@requestnetwork/epk-signature';
import {
  addToHinkalStore,
  hinkalStore,
  payPrivateErc20FeeProxyRequestFromHinkal,
  payPrivateErc20ProxyRequestFromHinkal,
  sendToPrivateRecipientFromHinkal,
} from '../../src/payment/erc-20-private-payment-hinkal';
import { getErc20Balance } from '../../src/payment/erc20';

// Constants to configure the tests
const currentNetwork: CurrencyTypes.ChainName = 'base';
const currencyAddress = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // USDC
const currentCurrenyType = Types.RequestLogic.CURRENCY.ERC20;
const currencyAmount = ethers.utils.parseUnits('0.00001', 6).toBigInt();
const currentGateway = 'https://sepolia.gateway.request.network';
const fee = '0';

// Payer's public/private EOA keys and shielded address
// The EOA address has a balance of 0, while the shielded address holds 1 USDC.
const PAYER_PUBLIC_KEY = '0x44DC1e666C1ca6717849efE19eAC72AD83cFf5d2';
const PAYER_PRIVATE_KEY = '0x3abdcb3d6d6c302a7943715d0b975ae1377d7d1d188820f6cd57b6f13fb5b0e0';
const PAYER_SHIELDED_ADDRESS =
  '142590100039484718476239190022599206250779986428210948946438848754146776167,0x096d6d5d8b2292aa52e57123a58fc4d5f3d66171acd895f22ce1a5b16ac51b9e,0xc025ccc6ef46399da52763a866a3a10d2eade509af27eb8411c5d251eb8cd34d';
// PAYEE - Public EOA - Recipient of the payment
const PAYEE = '0xA4faFa5523F63EE58aE7b56ad8EB5a344A19F266'; // some random address
// Sender (0x01aC930fAb20482E5b7eAbF892DF57141c29de5F) - Sends funds to a private address: you will need to top up sender
// Once the sender transfers funds to the recipient's private address, the recipient's shielded balance will be increased.
const senderMnemonic = 'sand win seed crucial film antique adapt start pupil gallery edge collect';

const RPC_URL = 'https://mainnet.base.org'; // Blockchain RPC endpoint for the Base networ

jest.setTimeout(1000000); // Set Jest timeout for asynchronous operations (e.g., blockchain calls)

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
        paymentAddress: PAYEE,
      },
    };
  } else if (type === Types.Extension.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT) {
    paymentNetwork = {
      id: type,
      parameters: {
        paymentNetworkName: currentNetwork,
        paymentAddress: PAYEE,
        feeAddress: PAYEE,
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
        value: PAYEE,
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

// This function is required to wait for the indexing of shielded balance changes in Hinkal
const waitLittle = (time = 15): Promise<number> =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve(1);
    }, time * 1000);
  });

describe('ERC-20 Private Payments With Hinkal', () => {
  let provider: providers.Provider;
  let payerWallet: ethers.Wallet;
  let senderWallet: ethers.Wallet;
  let senderAddress: string;
  beforeAll(async () => {
    provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    payerWallet = new ethers.Wallet(PAYER_PRIVATE_KEY, provider);
    senderWallet = Wallet.fromMnemonic(senderMnemonic).connect(provider);
    senderAddress = await senderWallet.getAddress();
    await addToHinkalStore(payerWallet);
  });
  afterAll(async () => {
    // Clear Hinkal's snapshots interval: needed for jest to finish as a process
    for (const key in hinkalStore) {
      hinkalStore[key].snapshotsClearInterval();
    }
    jest.clearAllTimers(); // Clear any pending Jest timers
  });

  describe('Privacy of a Sender: From Private to Public Transactions', () => {
    // Objectives of this test:
    // 1. The sender's address should never appear on-chain.
    // 2. The recipient should successfully receive the funds.
    // 3. The transaction should complete successfully.
    // Note: sender has $0 USDC on public EOA

    it('ERC-20 Proxy: Payer is not the same as Origin/Sender of Transaction', async () => {
      const requestData = await createRequestForHinkal(
        payerWallet,
        PAYER_PRIVATE_KEY,
        Types.Extension.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT,
      );
      const balanceErc20Before = await getErc20Balance(requestData, PAYEE, provider);

      const tx = await payPrivateErc20ProxyRequestFromHinkal(requestData, payerWallet);
      const balanceErc20After = await getErc20Balance(requestData, PAYEE, provider);

      await waitLittle(5); // wait before balance is increased

      expect(tx.status).toBe(1);
      expect(tx.from).not.toBe(PAYER_PUBLIC_KEY);
      expect(BigNumber.from(balanceErc20Before).lt(BigNumber.from(balanceErc20After)));
    });
    it.skip('ERC-20 Fee Proxy: Payer is not the same as Origin/Sender of Transaction', async () => {
      const requestData = await createRequestForHinkal(
        payerWallet,
        PAYER_PRIVATE_KEY,
        Types.Extension.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT,
      );

      const balanceErc20Before = await getErc20Balance(requestData, PAYEE, provider);
      const tx = await payPrivateErc20FeeProxyRequestFromHinkal(requestData, payerWallet);
      const balanceErc20After = await getErc20Balance(requestData, PAYEE, provider);

      await waitLittle(7); // wait before balance is increased
      expect(tx.status).toBe(1);
      expect(tx.from).not.toBe(PAYER_PUBLIC_KEY);
      expect(BigNumber.from(balanceErc20Before).lt(BigNumber.from(balanceErc20After)));
    });
  });
  describe.skip('Privacy of a Recipient: From Public to Private Transactions', () => {
    afterAll(async () => {
      for (let key in hinkalStore) {
        hinkalStore[key].snapshotsClearInterval();
        console.log('cleaning snapshot', { key });
      }
    });

    it('Sender sends from EOA to the shielded address of the recipient', async () => {
      // Objectives of this test:
      // 1. The recipient's address should never appear on-chain.
      // 2. The recipient should successfully receive the funds.
      // 3. The transaction should complete successfully.
      const preBalances = await hinkalStore[PAYER_PUBLIC_KEY].getBalances();
      const preUsdcBalance = preBalances.find(
        (balance) => balance.token.erc20TokenAddress === currencyAddress,
      )?.balance;
      const tx = await sendToPrivateRecipientFromHinkal(
        senderWallet,
        currencyAddress,
        currencyAmount,
        PAYER_SHIELDED_ADDRESS,
      );

      const waitedTx = await tx.wait(2);
      await waitLittle(7); // wait before balance is increased

      const postBalances = await hinkalStore[PAYER_PUBLIC_KEY].getBalances();
      const postUsdcBalance = postBalances.find(
        (balance) => balance.token.erc20TokenAddress === currencyAddress,
      )?.balance;

      expect(waitedTx.status).toBe(1);
      expect(PAYER_SHIELDED_ADDRESS).not.toBe(PAYER_PUBLIC_KEY); // trivial check (satisfies 2nd condition)
      if (postUsdcBalance === undefined || preUsdcBalance === undefined) {
        throw Error('no balance calculation');
      }
      expect(postUsdcBalance - preUsdcBalance).toBe(currencyAmount); // The recipient received funds in their shielded account.
    });
  });

  describe.skip('Shielding: Depositing funds from EOA to own shielded address', () => {
    beforeAll(async () => {
      await addToHinkalStore(senderWallet);
    });
    it('Sender send from EOA to its own shielded address', async () => {
      // For illustration, we show how a user can deposit to their own shielded address.
      // The user needs to do this to be able to send funds from their shielded address.

      const preBalances = await hinkalStore[senderAddress].getBalances();
      const preUsdcBalance = preBalances.find(
        (balance) => balance.token.erc20TokenAddress === currencyAddress,
      )?.balance;

      const tx = await sendToPrivateRecipientFromHinkal(
        senderWallet,
        currencyAddress,
        currencyAmount,
      );
      const waitedTx = await tx.wait(2);

      await waitLittle(10); // wait before balance is increased

      const postBalances = await hinkalStore[senderAddress].getBalances();
      const postUsdcBalance = postBalances.find(
        (balance) => balance.token.erc20TokenAddress === currencyAddress,
      )?.balance;

      expect(waitedTx.status).toBe(1);
      if (postUsdcBalance === undefined || preUsdcBalance === undefined) {
        throw Error('no balance calculation');
      }
      expect(postUsdcBalance - preUsdcBalance).toBe(currencyAmount); // The recipient received funds in their shielded account.
    });
  });
});
