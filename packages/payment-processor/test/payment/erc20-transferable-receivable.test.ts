import { Wallet, BigNumber, providers, utils } from 'ethers';

import {
  ClientTypes,
  ExtensionTypes,
  IdentityTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import { deepCopy } from '@requestnetwork/utils';

import { Erc20PaymentNetwork, PaymentReferenceCalculator } from '@requestnetwork/payment-detection';
import { ERC20TransferableReceivable__factory } from '@requestnetwork/smart-contracts/types';

import { approveErc20, getErc20Balance } from '../../src/payment/erc20';
import {
  getReceivableTokenIdForRequest,
  mintErc20TransferableReceivable,
  payErc20TransferableReceivableRequest,
} from '../../src/payment/erc20-transferable-receivable';
import { getProxyAddress } from '../../src/payment/utils';

/* eslint-disable no-magic-numbers */
/* eslint-disable @typescript-eslint/no-unused-expressions */

const erc20ContractAddress = '0x9FBDa871d559710256a2502A2517b794B482Db40';

const mnemonic = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat';
const feeAddress = '0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef';
const provider = new providers.JsonRpcProvider('http://localhost:8545');
const payeeWallet = Wallet.createRandom().connect(provider);
const thirdPartyWallet = Wallet.createRandom().connect(provider);
const wallet = Wallet.fromMnemonic(mnemonic, "m/44'/60'/0'/0/1").connect(provider);
const paymentAddress = payeeWallet.address;

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
  currency: 'DAI',
  currencyInfo: {
    network: 'private',
    type: RequestLogicTypes.CURRENCY.ERC20,
    value: erc20ContractAddress,
  },
  events: [],
  expectedAmount: '100',
  extensions: {
    [ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_TRANSFERABLE_RECEIVABLE]: {
      events: [],
      id: ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_TRANSFERABLE_RECEIVABLE,
      type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
      values: {
        feeAddress,
        feeAmount: '0',
        paymentAddress,
        salt: '0ee84db293a752c6',
      },
      version: '0.1.0',
    },
  },
  payee: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: paymentAddress,
  },
  extensionsData: [],
  meta: {
    transactionManagerMeta: {},
  },
  pending: null,
  requestId: '0188791633ff0ec72a7dbdefb886d2db6cccfa98287320839c2f173c7a4e3ce7e1',
  state: RequestLogicTypes.STATE.CREATED,
  timestamp: 0,
  version: '1.0',
};

describe('erc20-transferable-receivable', () => {
  beforeAll(async () => {
    // Send funds to payeeWallet
    let tx = {
      to: paymentAddress,
      // Convert currency unit from ether to wei
      value: utils.parseEther('1'),
    };

    let txResponse = await wallet.sendTransaction(tx);
    await txResponse.wait(1);

    // Send funds to thirdPartyWallet
    tx = {
      to: thirdPartyWallet.address,
      // Convert currency unit from ether to wei
      value: utils.parseEther('1'),
    };

    txResponse = await wallet.sendTransaction(tx);
    await txResponse.wait(1);

    const mintTx = await mintErc20TransferableReceivable(validRequest, payeeWallet, {
      gasLimit: BigNumber.from('20000000'),
    });
    const confirmedTx = await mintTx.wait(1);

    expect(confirmedTx.status).toBe(1);
    expect(mintTx.hash).not.toBeUndefined();
  });

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe('mintErc20TransferableReceivable works', () => {
    it('rejects paying without minting', async () => {
      // Different request without a minted receivable
      const request = deepCopy(validRequest) as ClientTypes.IRequestData;
      // Change the request id
      request.requestId = '0188791633ff0ec72a7dbdefb886d2db6cccfa98287320839c2f173c7a4e3ce7e2';

      await expect(payErc20TransferableReceivableRequest(request, wallet)).rejects.toThrowError(
        'The receivable for this request has not been minted yet. Please check with the payee.',
      );
    });
  });

  describe('payErc20TransferableReceivableRequest', () => {
    it('should throw an error if the request is not erc20', async () => {
      const request = deepCopy(validRequest) as ClientTypes.IRequestData;
      request.currencyInfo.type = RequestLogicTypes.CURRENCY.ETH;

      await expect(payErc20TransferableReceivableRequest(request, wallet)).rejects.toThrowError(
        'request cannot be processed, or is not an pn-erc20-transferable-receivable request',
      );
    });

    it('should throw an error if the currencyInfo has no value', async () => {
      const request = deepCopy(validRequest);
      request.currencyInfo.value = '';
      await expect(payErc20TransferableReceivableRequest(request, wallet)).rejects.toThrowError(
        'request cannot be processed, or is not an pn-erc20-transferable-receivable request',
      );
    });

    it('should throw an error if the payee is undefined', async () => {
      const request = deepCopy(validRequest);
      request.payee = undefined;
      await expect(payErc20TransferableReceivableRequest(request, wallet)).rejects.toThrowError(
        'Expected a payee for this request',
      );
    });

    it('should throw an error if currencyInfo has no network', async () => {
      const request = deepCopy(validRequest);
      // @ts-expect-error Type '""' is not assignable to type 'ChainName | undefined'
      request.currencyInfo.network = '';
      await expect(payErc20TransferableReceivableRequest(request, wallet)).rejects.toThrowError(
        'Payment currency must have a network',
      );
    });

    it('should throw an error if request has no extension', async () => {
      const request = deepCopy(validRequest);
      request.extensions = [] as any;

      await expect(payErc20TransferableReceivableRequest(request, wallet)).rejects.toThrowError(
        'PaymentNetwork not found',
      );
    });

    it('should consider override parameters', async () => {
      const spy = jest.fn();
      const originalSendTransaction = wallet.sendTransaction.bind(wallet);
      wallet.sendTransaction = spy;
      await payErc20TransferableReceivableRequest(validRequest, wallet, undefined, undefined, {
        gasPrice: '20000000000',
      });
      const shortReference = PaymentReferenceCalculator.calculate(
        validRequest.requestId,
        validRequest.extensions[ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_TRANSFERABLE_RECEIVABLE]
          .values.salt,
        paymentAddress,
      );

      const tokenId = await getReceivableTokenIdForRequest(validRequest, wallet);
      expect(tokenId.isZero()).toBe(false);

      expect(spy).toHaveBeenCalledWith({
        data: `0x314ee2d900000000000000000000000000000000${utils
          .hexZeroPad(tokenId.toHexString(), 16)
          .substring(
            2,
          )}000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c5fdf4076b8f3a5357c5e395ab970b5b54098fef0000000000000000000000000000000000000000000000000000000000000008${shortReference}000000000000000000000000000000000000000000000000`,
        gasPrice: '20000000000',
        to: '0xF426505ac145abE033fE77C666840063757Be9cd',
        value: 0,
      });
      wallet.sendTransaction = originalSendTransaction;
    });

    it('should pay an ERC20 transferable receivable request with fees', async () => {
      // first approve the contract
      const approvalTx = await approveErc20(validRequest, wallet);
      const approvalTxReceipt = await approvalTx.wait(1);

      expect(approvalTxReceipt.status).toBe(1);
      expect(approvalTx.hash).not.toBeUndefined();

      // get the balance to compare after payment
      const balanceEthBefore = await wallet.getBalance();
      const balanceErc20Before = await getErc20Balance(validRequest, payeeWallet.address, provider);

      const tx = await payErc20TransferableReceivableRequest(validRequest, wallet, 1, 0, {
        gasLimit: BigNumber.from('20000000'),
      });

      const confirmedTx = await tx.wait(1);

      const balanceEthAfter = await wallet.getBalance();
      const balanceErc20After = await getErc20Balance(validRequest, payeeWallet.address, provider);

      expect(confirmedTx.status).toBe(1);
      expect(tx.hash).not.toBeUndefined();

      expect(balanceEthAfter.lte(balanceEthBefore)).toBeTruthy(); // 'ETH balance should be lower'

      // ERC20 balance should be lower
      expect(
        BigNumber.from(balanceErc20After).eq(BigNumber.from(balanceErc20Before).add(1)),
      ).toBeTruthy();
    });

    it('other wallets can mint receivable for owner', async () => {
      // Request without a receivable minted yet
      const request = deepCopy(validRequest) as ClientTypes.IRequestData;
      // Change the request id
      request.requestId = '0188791633ff0ec72a7dbdefb886d2db6cccfa98287320839c2f173c7a4e3ce7e3';

      const mintTx = await mintErc20TransferableReceivable(request, thirdPartyWallet, {
        gasLimit: BigNumber.from('20000000'),
      });
      let confirmedTx = await mintTx.wait(1);

      expect(confirmedTx.status).toBe(1);
      expect(mintTx.hash).not.toBeUndefined();

      // get the balance to compare after payment
      const balanceErc20Before = await getErc20Balance(request, payeeWallet.address, provider);

      const tx = await payErc20TransferableReceivableRequest(request, wallet, 1, 0, {
        gasLimit: BigNumber.from('20000000'),
      });

      confirmedTx = await tx.wait(1);

      const balanceErc20After = await getErc20Balance(request, payeeWallet.address, provider);

      expect(confirmedTx.status).toBe(1);
      expect(tx.hash).not.toBeUndefined();

      // ERC20 balance should be lower
      expect(
        BigNumber.from(balanceErc20After).eq(BigNumber.from(balanceErc20Before).add(1)),
      ).toBeTruthy();
    });

    it('rejects paying unless minted to correct owner', async () => {
      // Request without a receivable minted yet
      const request = deepCopy(validRequest) as ClientTypes.IRequestData;
      // Change the request id
      request.requestId = '0188791633ff0ec72a7dbdefb886d2db6cccfa98287320839c2f173c7a4e3ce7e4';

      let shortReference = PaymentReferenceCalculator.calculate(
        request.requestId,
        request.extensions[ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_TRANSFERABLE_RECEIVABLE].values
          .salt,
        paymentAddress,
      );
      let metadata = Buffer.from(request.requestId).toString('base64');
      let receivableContract = ERC20TransferableReceivable__factory.createInterface();
      let data = receivableContract.encodeFunctionData('mint', [
        thirdPartyWallet.address,
        `0x${shortReference}`,
        '100',
        erc20ContractAddress,
        metadata,
      ]);
      let tx = await thirdPartyWallet.sendTransaction({
        data,
        to: getProxyAddress(
          request,
          Erc20PaymentNetwork.ERC20TransferableReceivablePaymentDetector.getDeploymentInformation,
        ),
        value: 0,
      });
      let confirmedTx = await tx.wait(1);

      expect(confirmedTx.status).toBe(1);
      expect(tx.hash).not.toBeUndefined();

      await expect(payErc20TransferableReceivableRequest(request, wallet)).rejects.toThrowError(
        'The receivable for this request has not been minted yet. Please check with the payee.',
      );

      // Mint the receivable for the correct paymentAddress
      shortReference = PaymentReferenceCalculator.calculate(
        request.requestId,
        request.extensions[ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_TRANSFERABLE_RECEIVABLE].values
          .salt,
        paymentAddress,
      );
      metadata = Buffer.from(request.requestId).toString('base64');
      receivableContract = ERC20TransferableReceivable__factory.createInterface();
      data = receivableContract.encodeFunctionData('mint', [
        paymentAddress,
        `0x${shortReference}`,
        '100',
        erc20ContractAddress,
        metadata,
      ]);
      tx = await thirdPartyWallet.sendTransaction({
        data,
        to: getProxyAddress(
          request,
          Erc20PaymentNetwork.ERC20TransferableReceivablePaymentDetector.getDeploymentInformation,
        ),
        value: 0,
      });
      confirmedTx = await tx.wait(1);

      expect(confirmedTx.status).toBe(1);
      expect(tx.hash).not.toBeUndefined();

      // get the balance to compare after payment
      const balanceErc20Before = await getErc20Balance(request, payeeWallet.address, provider);

      tx = await payErc20TransferableReceivableRequest(request, wallet, 1, 0, {
        gasLimit: BigNumber.from('20000000'),
      });

      confirmedTx = await tx.wait(1);

      const balanceErc20After = await getErc20Balance(request, payeeWallet.address, provider);

      expect(confirmedTx.status).toBe(1);
      expect(tx.hash).not.toBeUndefined();

      // ERC20 balance should be lower
      expect(
        BigNumber.from(balanceErc20After).eq(BigNumber.from(balanceErc20Before).add(1)),
      ).toBeTruthy();
    });
  });
});
