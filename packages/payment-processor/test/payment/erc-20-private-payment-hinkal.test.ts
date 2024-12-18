import { BigNumber, ethers, providers, Wallet } from 'ethers';
import { RequestNetwork, Types, Utils } from '@requestnetwork/request-client.js';
import { CurrencyTypes } from '@requestnetwork/types';
import { EthereumPrivateKeySignatureProvider } from '@requestnetwork/epk-signature';
import {
  addToHinkalStore,
  hinkalStore,
  payErc20FeeProxyRequestFromHinkalShieldedAddress,
  payErc20ProxyRequestFromHinkalShieldedAddress,
  sendToHinkalShieldedAddressFromPublic,
} from '../../src/payment/erc-20-private-payment-hinkal';
import { getErc20Balance } from '../../src/payment/erc20';

// Constants to configure the tests
const currentNetwork: CurrencyTypes.ChainName = 'base';
const currencyAddress = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // USDC
const currentCurrenyType = Types.RequestLogic.CURRENCY.ERC20;
const currencyAmount = ethers.utils.parseUnits('0.000001', 6).toBigInt();
const currentGateway = 'https://sepolia.gateway.request.network';
const fee = ethers.utils.parseUnits('0.000001', 6).toString();

// Payer:
// 1) sends funds from his shielded address to EOA of the payee
// 2) sends funds from his EOA to the shielded address of the payee
// 3) sends funds from hiw EOA to his own shielded address
// Note: to successfully run the tests, you will need to top up payer's EOA address with Eth on base
const payerMnemonic = 'sand win seed crucial film antique adapt start pupil gallery edge collect';
const payerAddress = '0x01aC930fAb20482E5b7eAbF892DF57141c29de5F';
// Payee:
// 1) receives funds on her public EOA address
// 2) receives funds on her shielded address
// The private key of a public address grant ownership of the corresponding shielded address. In @hinkal/common, a single public address can have only one shielded address.
const payeeAddress = '0x44DC1e666C1ca6717849efE19eAC72AD83cFf5d2';
const payeePrivateKey = '0x3abdcb3d6d6c302a7943715d0b975ae1377d7d1d188820f6cd57b6f13fb5b0e0';
const payeeShieldedAddress =
  '142590100039484718476239190022599206250779986428210948946438848754146776167,0x096d6d5d8b2292aa52e57123a58fc4d5f3d66171acd895f22ce1a5b16ac51b9e,0xc025ccc6ef46399da52763a866a3a10d2eade509af27eb8411c5d251eb8cd34d';

const RPC_URL = 'https://mainnet.base.org'; // Blockchain RPC endpoint for the Base network

jest.setTimeout(30000); // Set Jest timeout for asynchronous operations (e.g., blockchain calls)

/**
 * Function to create a payment request for Hinkal.
 * This sets up the Request Network with payer and payee information.
 * @param payerWallet The wallet of the payer.
 * @param privateKey The private key of the payer (for signing).
 * @param type The payment network type (e.g., ERC20_PROXY_CONTRACT).
 * @returns A Promise that resolves to the request data with events.
 */
const createRequestForHinkal = async (
  payerWallet: ethers.Wallet,
  type: Types.Extension.PAYMENT_NETWORK_ID,
): Promise<Types.IRequestDataWithEvents> => {
  // step 1: Create Signature Provider
  const epkSignatureProvider = new EthereumPrivateKeySignatureProvider({
    method: Types.Signature.METHOD.ECDSA,
    privateKey: payerWallet.privateKey,
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
        paymentAddress: payeeAddress,
      },
    };
  } else if (type === Types.Extension.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT) {
    paymentNetwork = {
      id: type,
      parameters: {
        paymentNetworkName: currentNetwork,
        paymentAddress: payeeAddress,
        feeAddress: payeeAddress,
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
        value: payeeAddress,
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

// Helper function: allows to get a shielded balance of a specific token
const getTokenShieldedBalance = async (
  address: string,
  tokenAddress = currencyAddress,
): Promise<bigint> => {
  const balances = await hinkalStore[address].getBalances();
  const tokenBalance = balances.find(
    (balance) => balance.token.erc20TokenAddress === tokenAddress,
  )?.balance;

  if (tokenBalance === undefined) {
    throw Error('Shiedled Balance calculated incorrectly');
  }
  return tokenBalance;
};

describe('ERC-20 Private Payments With Hinkal', () => {
  let provider: providers.Provider;
  let payerWallet: ethers.Wallet;
  let payeeWallet: ethers.Wallet;
  beforeAll(async () => {
    provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    payerWallet = Wallet.fromMnemonic(payerMnemonic).connect(provider);
    payeeWallet = new Wallet(payeePrivateKey, provider);
    await addToHinkalStore(payerWallet);
  });
  afterAll(async () => {
    for (const key in hinkalStore) {
      hinkalStore[key].snapshotsClearInterval(); // Clear Hinkal's snapshots interval: needed for jest to finish as a process
    }
    jest.clearAllTimers(); // Clear any pending Jest timers
  });

  describe('Privacy of a Sender: From Private to Public Transactions', () => {
    // Objectives of this test:
    // 1. The payer's address should never appear on-chain.
    // 2. The payee should successfully receive the funds.
    // 3. The transaction should complete successfully.

    it('ERC-20 Proxy: Payer is not the same as Origin/Sender of Transaction', async () => {
      const requestData = await createRequestForHinkal(
        payerWallet,
        Types.Extension.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT,
      );
      const balanceErc20Before = await getErc20Balance(requestData, payeeAddress, provider);

      const tx = await payErc20ProxyRequestFromHinkalShieldedAddress(requestData, payerWallet);
      const balanceErc20After = await getErc20Balance(requestData, payeeAddress, provider);

      expect(tx.status).toBe(1);
      expect(tx.from).not.toBe(payerAddress);
      expect(BigNumber.from(balanceErc20Before).lt(BigNumber.from(balanceErc20After)));
    });
    it('ERC-20 Fee Proxy: Payer is not the same as Origin/Sender of Transaction', async () => {
      const requestData = await createRequestForHinkal(
        payerWallet,
        Types.Extension.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT,
      );

      const balanceErc20Before = await getErc20Balance(requestData, payeeAddress, provider);
      const tx = await payErc20FeeProxyRequestFromHinkalShieldedAddress(requestData, payerWallet);
      const balanceErc20After = await getErc20Balance(requestData, payeeAddress, provider);

      expect(tx.status).toBe(1);
      expect(tx.from).not.toBe(payerAddress);
      expect(BigNumber.from(balanceErc20Before).lt(BigNumber.from(balanceErc20After)));
    });
  });

  describe('Shielding: Depositing funds from EOA to own shielded address', () => {
    it('Payer sends from EOA to its own shielded address', async () => {
      // For illustration: we show how payer can send funds to his own shielded address.
      // The payer needs to do this to be able to send funds from his shielded address.

      const preUsdcBalance = await getTokenShieldedBalance(payerAddress);

      const tx = await sendToHinkalShieldedAddressFromPublic(
        payerWallet,
        currencyAddress,
        currencyAmount,
      );
      const waitedTx = await tx.wait(2);

      await waitLittle(7); // wait before balance is increased

      const postUsdcBalance = await getTokenShieldedBalance(payerAddress);

      expect(waitedTx.status).toBe(1);
      expect(postUsdcBalance - preUsdcBalance).toBe(currencyAmount); // The payer received funds in his shielded address.
    });
  });

  describe('Privacy of a Recipient: From Public to Private Transactions', () => {
    beforeAll(async () => {
      await addToHinkalStore(payeeWallet);
    });

    it('Payer sends from EOA to the shielded address of the payee', async () => {
      // Objectives of this test:
      // 1. The payee's address should never appear on-chain.
      // 2. The payee should successfully receive the funds.
      // 3. The transaction should complete successfully.

      const preUsdcBalance = await getTokenShieldedBalance(payeeAddress);

      const tx = await sendToHinkalShieldedAddressFromPublic(
        payerWallet,
        currencyAddress,
        currencyAmount,
        payeeShieldedAddress,
      );

      const waitedTx = await tx.wait(2);
      await waitLittle(1); // wait before balance is increased

      const postUsdcBalance = await getTokenShieldedBalance(payeeAddress);

      expect(waitedTx.status).toBe(1);
      expect(payeeShieldedAddress).not.toBe(payeeAddress); // trivial check (satisfies 2nd condition)
      expect(postUsdcBalance - preUsdcBalance).toBe(currencyAmount); // The payee received funds in their shielded account.
    });
  });
});
