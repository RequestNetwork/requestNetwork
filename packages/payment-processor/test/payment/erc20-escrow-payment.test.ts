import { Wallet, providers, BigNumber } from 'ethers';
import {
  ClientTypes,
  ExtensionTypes,
  IdentityTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import { Escrow } from '@requestnetwork/payment-processor';
import { getRequestPaymentValues, getSigner } from '../../src/payment/utils';

import { erc20EscrowToPayArtifact } from '@requestnetwork/smart-contracts';
import { getErc20Balance } from '../../src/payment/erc20';

/* eslint-disable no-magic-numbers */
/* eslint-disable @typescript-eslint/no-unused-expressions */

const erc20ContractAddress = '0x9FBDa871d559710256a2502A2517b794B482Db40';
const mnemonic = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat';
const paymentAddress = '0xf17f52151EbEF6C7334FAD080c5704D77216b732';
const feeAddress = '0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef';
const provider = new providers.JsonRpcProvider('http://localhost:8545');
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
  currency: 'DAI',
  currencyInfo: {
    network: 'private',
    type: RequestLogicTypes.CURRENCY.ERC20,
    value: erc20ContractAddress,
  },
  events: [],
  expectedAmount: '100',
  extensions: {
    [PaymentTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT]: {
      events: [],
      id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT,
      type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
      values: {
        feeAddress,
        feeAmount: '2',
        paymentAddress,
        salt: 'salt' + Math.floor(Math.random() * 10000000),
      },
      version: '0.1.0',
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

const escrowAddress = erc20EscrowToPayArtifact.getAddress(validRequest.currencyInfo.network!);
const payerAddress = wallet.address;

describe('erc20-escrow-payment tests:', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe('Test sanity checks:', () => {
    const { paymentReference } = getRequestPaymentValues(validRequest);

    it('Should pass with correct values.', () => {
      const values = getRequestPaymentValues(validRequest);

      expect(values.feeAddress).toBe(feeAddress);
      expect(values.feeAmount).toBe('2');
      expect(values.paymentAddress).toBe(paymentAddress);
      expect(values.paymentReference).toBe(paymentReference);
    });
    it('Should throw an error if the request is not erc20', async () => {
      const request = Utils.deepCopy(validRequest) as ClientTypes.IRequestData;
      request.currencyInfo.type = RequestLogicTypes.CURRENCY.ETH;
  
      await expect(Escrow.payEscrow(request, wallet)).rejects.toThrowError(
        "request cannot be processed, or is not an pn-erc20-fee-proxy-contract request",
      );
    });
    it('Should throw an error if the currencyInfo has no value', async () => {
      const request = Utils.deepCopy(validRequest);
      request.currencyInfo.value = '';
      await expect(Escrow.payEscrow(request, wallet)).rejects.toThrowError(
        "request cannot be processed, or is not an pn-erc20-fee-proxy-contract request",
      );
    });
    it('Should throw an error if currencyInfo has no network', async () => {
      const request = Utils.deepCopy(validRequest);
      request.currencyInfo.network = '';
      await expect(Escrow.payEscrow(request, wallet)).rejects.toThrowError(
        "request cannot be processed, or is not an pn-erc20-fee-proxy-contract request",
      );
    });
    it('Should throw an error if request has no extension', async () => {
      const request = Utils.deepCopy(validRequest);
      request.extensions = [] as any;
  
      await expect(Escrow.payEscrow(request, wallet)).rejects.toThrowError(
        'no payment network found',
      );
    });
    it('Should consider override parameters', async () => {
      const spy = jest.fn();
      const originalSendTransaction = wallet.sendTransaction.bind(wallet);
      wallet.sendTransaction = spy;

      const values = getRequestPaymentValues(validRequest);

      await Escrow.payEscrow(validRequest, wallet, undefined);

      expect(spy).toHaveBeenCalledWith({
        data: `0x325a00f00000000000000000000000009fbda871d559710256a2502a2517b794b482db40000000000000000000000000f17f52151ebef6c7334fad080c5704d77216b732000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000002000000000000000000000000c5fdf4076b8f3a5357c5e395ab970b5b54098fef0000000000000000000000000000000000000000000000000000000000000008${values.paymentReference}000000000000000000000000000000000000000000000000`,
        to: '0xF08dF3eFDD854FEDE77Ed3b2E515090EEe765154',
        value: 0,
      });
      wallet.sendTransaction = originalSendTransaction;
    });
  });

  describe('Test encoded function data:', () => {
    const values = getRequestPaymentValues(validRequest);

    it('Should encode data to execute payEscrow().', () => {
      expect(Escrow.encodePayEscrow(validRequest, wallet)).toBe(
        `0x325a00f00000000000000000000000009fbda871d559710256a2502a2517b794b482db40000000000000000000000000f17f52151ebef6c7334fad080c5704d77216b732000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000002000000000000000000000000c5fdf4076b8f3a5357c5e395ab970b5b54098fef0000000000000000000000000000000000000000000000000000000000000008${values.paymentReference}000000000000000000000000000000000000000000000000`,
      );
    });
    it('Should encode data to execute payRequestFromEscrow().', () => {
      expect(Escrow.encodePayRequestFromEscrow(validRequest, wallet)).toBe(
        `0x2a16f4c300000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000008${values.paymentReference}000000000000000000000000000000000000000000000000`,
      );
    });
    it('Should encode data to execute freezeRequest().', () => {
      expect(Escrow.encodeFreezeRequest(validRequest, wallet)).toBe(
        `0x82865e9d00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000008${values.paymentReference}000000000000000000000000000000000000000000000000`,
      );
    });
    it('Should encode data to execute initiateEmergencyClaim().', () => {
      expect(Escrow.encodeInitiateEmergencyClaim(validRequest, wallet)).toBe(
        `0x3a322d4500000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000008${values.paymentReference}000000000000000000000000000000000000000000000000`,
      );
    });
    it('Should encode data to execute completeEmergencyClaim().', () => {
      expect(Escrow.encodeCompleteEmergencyClaim(validRequest, wallet)).toBe(
        `0x6662e1e000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000008${values.paymentReference}000000000000000000000000000000000000000000000000`,
      );
    });
    it('Should encode data to execute revertEmergencyClaim().', () => {
      expect(Escrow.encodeRevertEmergencyClaim(validRequest, wallet)).toBe(
        `0x0797560800000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000008${values.paymentReference}000000000000000000000000000000000000000000000000`,
      );
    });
    it('Should encode data to execute refundFrozenFunds().', () => {
      expect(Escrow.encodeRefundFrozenFunds(validRequest, wallet)).toBe(
        `0x1a77f53a00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000008${values.paymentReference}000000000000000000000000000000000000000000000000`,
      );
    });
  });

  describe('Main use cases:', () => {
    beforeEach(async () => {
      await Escrow.approveErc20ForEscrow(validRequest, erc20ContractAddress, wallet);
    });

    describe('Normal Flow:', () => {
      it('Should pay the amount and fee from payers account', async () => {
        const request = Utils.deepCopy(validRequest) as ClientTypes.IRequestData;

        const payerBeforeBalance = await getErc20Balance(request, payerAddress);
        const escrowBeforeBalance = await getErc20Balance(request, escrowAddress);
        const feeBeforeBalance = await getErc20Balance(request, feeAddress);

        await Escrow.payEscrow(request, wallet, undefined, undefined);

        const payerAfterBalance = await getErc20Balance(request, payerAddress);
        const escrowAfterBalance = await getErc20Balance(request, escrowAddress);
        const feeAfterBalance = await getErc20Balance(request, feeAddress);

        // Expect payer ERC20 balance should be lower.
        expect(
          BigNumber.from(payerAfterBalance).eq(BigNumber.from(payerBeforeBalance).sub(102)),
        ).toBeTruthy();
        // Expect fee ERC20 balance should be higher.
        expect(
          BigNumber.from(feeAfterBalance).eq(BigNumber.from(feeBeforeBalance).add(2)),
        ).toBeTruthy();
        // Expect escrow Erc20 balance should be higher.
        expect(
          BigNumber.from(escrowAfterBalance).eq(BigNumber.from(escrowBeforeBalance).add(100)),
        ).toBeTruthy();
      });
      it('Should withdraw funds and pay funds from escrow to payee', async () => {
        // Set a new requestID to test independent unit-tests.
        const request = Utils.deepCopy(validRequest) as ClientTypes.IRequestData;
        request.requestId = 'aabb';

        // Execute payEscrow
        await Escrow.payEscrow(request, wallet, undefined, undefined);

        // Stores balance after payEscrow(), and before withdraws.
        const payeeBeforeBalance = await getErc20Balance(request, paymentAddress);
        const escrowBeforeBalance = await getErc20Balance(request, escrowAddress);

        await Escrow.payRequestFromEscrow(request, wallet);

        // Stores balances after withdraws to compare before balance with after balance.
        const payeeAfterBalance = await getErc20Balance(request, paymentAddress);
        const escrowAfterBalance = await getErc20Balance(request, escrowAddress);

        // Expect escrow Erc20 balance should be lower.
        expect(
          BigNumber.from(escrowAfterBalance).eq(BigNumber.from(escrowBeforeBalance).sub(100)),
        ).toBeTruthy();
        // Expect payee ERC20 balance should be higher.
        expect(
          BigNumber.from(payeeAfterBalance).eq(BigNumber.from(payeeBeforeBalance).add(100)),
        ).toBeTruthy();
      });
    });

    describe('Emergency Flow:', () => {
      it('Should initiate emergency claim', async () => {
        // Set a new requestID to test independent unit-tests.
        const request = Utils.deepCopy(validRequest) as ClientTypes.IRequestData;
        request.requestId = 'aacc';

        // Assign the paymentAddress as the payee.
        const payee = getSigner(provider, paymentAddress);

        // Execute payEscrow.
        expect(
          await (await Escrow.payEscrow(request, wallet, undefined, undefined)).wait(1),
        ).toBeTruthy();

        // Payer initiate emergency claim.
        const tx = await Escrow.initiateEmergencyClaim(request, payee);
        const confirmedTx = await tx.wait(1);
        
        // Checks the status and tx.hash.
        expect(confirmedTx.status).toBe(1);
        expect(tx.hash).toBeDefined();
      });
      it('Should revert emergency claim', async () => {
        // Set a new requestID to test independent unit-tests.
        const request = Utils.deepCopy(validRequest) as ClientTypes.IRequestData;
        request.requestId = 'aadd';

        // Assign the paymentAddress as the payee.
        const payee = getSigner(provider, paymentAddress);

        // Execute payEscrow.
        await (await Escrow.payEscrow(request, wallet, undefined, undefined)).wait(1);

        // Payer initiate emergency claim.
        await (await Escrow.initiateEmergencyClaim(request, payee)).wait(1);
        
        // Payer reverts the emergency claim.
        const tx = await Escrow.revertEmergencyClaim(request, wallet);
        const confirmedTx = await tx.wait(1);

        // Checks the status and tx.hash.
        expect(confirmedTx.status).toBe(1);
        expect(tx.hash).toBeDefined();
      });
    });
    
    describe('Freeze Request Flow:', () => {
      it('Should freeze funds:', async () => {
        // Set a new requestID to test independent unit-tests.
        const request = Utils.deepCopy(validRequest) as ClientTypes.IRequestData;
        request.requestId = 'aaee';

        // Execute payEscrow function on smart contract.
        await (await Escrow.payEscrow(request, wallet, undefined, undefined)).wait(1);

        // Payer freeze escrow funds.
        const tx = await Escrow.freezeRequest(request, wallet);
        const confirmedTx = await tx.wait(1);

        // Checks the status and tx.hash.
        expect(confirmedTx.status).toBe(1);
        expect(tx.hash).toBeDefined();
      });
      it('Should revert if tried to withdraw to early:', async () => {
        // Set a new requestID to test independent unit-tests.
        const request = Utils.deepCopy(validRequest) as ClientTypes.IRequestData;
        request.requestId = 'aaff';

        // Execute payEscrow.
        await (await Escrow.payEscrow(request, wallet, undefined, undefined)).wait(1);

        // Payer executes a freeze of escrow funds.
        await (await Escrow.freezeRequest(request, wallet)).wait(1);
        
        // Payer tries to withdraw frozen funds before unlock date.
        await expect(Escrow.refundFrozenFunds(request, wallet)).rejects.toThrowError('Not Yet!',);
      });
    });
  });
}); 
