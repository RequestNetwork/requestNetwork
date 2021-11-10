import { Wallet, providers, BigNumber } from 'ethers';
import {
  ClientTypes,
  ExtensionTypes,
  IdentityTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
//import Utils from '@requestnetwork/utils';
import {
  payEscrow,
  encodeRequestMapping,
  encodePayEscrow,
  encodePayRequestFromEscrow,
  encodeInitiateEmergencyClaim,
  encodeCompleteEmergencyClaim,
  encodeRevertEmergencyClaim,
  encodeFreezeRequest,
  encodeRefundFrozenFunds,
} from '../../src/payment/erc20-escrow-payment';
import { getAmountToPay, getRequestPaymentValues } from '../../src/payment/utils';
import { getErc20Balance, hasErc20Approval } from '../../src/';
import { erc20EscrowToPayArtifact, erc20FeeProxyArtifact } from '@requestnetwork/smart-contracts';

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
const proxyAddress = erc20FeeProxyArtifact.getAddress(validRequest.currencyInfo.network!);
const payerAddress = wallet.address;

describe('erc20-escrow-payment tests:', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe('test request payment values:', () => {
    const { paymentReference } = getRequestPaymentValues(validRequest);
    const amount = getAmountToPay(validRequest);

    it('Should pass with correct values.', () => {
      const values = getRequestPaymentValues(validRequest);

      expect(values.feeAddress).toBe(feeAddress);
      expect(values.feeAmount).toBe('2');
      expect(values.paymentAddress).toBe(paymentAddress);
      expect(values.paymentReference).toBe(paymentReference);

      console.log(`
      ---ERC20 EscrowToPay-payments:---
          RequestPaymentValues:
            * PaymentReference         :               0x${values.paymentReference}
            *
            * ERC20 PaymentToken       :               ${erc20ContractAddress},
            * Proxy Address            :               ${proxyAddress},
            * Escrow Address           :               ${escrowAddress},
            * Payer Address            :               ${payerAddress},
            * Payee Address            :               ${values.paymentAddress},
            * Fee Address              :               ${values.feeAddress}
            * 
            * AmountToPay              :               ${amount},
            * FeeAmount                :               ${values.feeAmount}
            * 
            * Request ID               :               ${validRequest.requestId},
            * Network                  :               ${values.network},
            * Version                  :               ${values.version},
            *
            * Tokens accepted          :               ${values.tokensAccepted},
            * MaxRateTimeSpan          :               ${values.maxRateTimespan},
            * 
          
          `);
    });
    it('Should consider override parameters', async () => {
      const spy = jest.fn();
      const originalSendTransaction = wallet.sendTransaction.bind(wallet);
      wallet.sendTransaction = spy;

      const values = getRequestPaymentValues(validRequest);

      await payEscrow(validRequest, wallet, undefined, undefined, {
        gasPrice: '20000000000',
      });

      expect(spy).toHaveBeenCalledWith({
        data: `0x325a00f00000000000000000000000009fbda871d559710256a2502a2517b794b482db40000000000000000000000000f17f52151ebef6c7334fad080c5704d77216b732000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000002000000000000000000000000c5fdf4076b8f3a5357c5e395ab970b5b54098fef0000000000000000000000000000000000000000000000000000000000000008${values.paymentReference}000000000000000000000000000000000000000000000000`,
        to: '0xF08dF3eFDD854FEDE77Ed3b2E515090EEe765154',
        gasPrice: '20000000000',
        value: 0,
      });
      wallet.sendTransaction = originalSendTransaction;
    });
  });

  describe('test encoded function data:', () => {
    const values = getRequestPaymentValues(validRequest);

    it('Should encode data to execute payEscrow().', () => {
      expect(encodePayEscrow(validRequest, wallet)).toBe(
        `0x325a00f00000000000000000000000009fbda871d559710256a2502a2517b794b482db40000000000000000000000000f17f52151ebef6c7334fad080c5704d77216b732000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000002000000000000000000000000c5fdf4076b8f3a5357c5e395ab970b5b54098fef0000000000000000000000000000000000000000000000000000000000000008${values.paymentReference}000000000000000000000000000000000000000000000000`,
      );
    });
    it('Should encode data to execute payRequestFromEscrow().', () => {
      expect(encodePayRequestFromEscrow(validRequest, wallet)).toBe(
        `0x2a16f4c300000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000008${values.paymentReference}000000000000000000000000000000000000000000000000`,
      );
    });
    it('Should encode data to execute freezeRequest().', () => {
      expect(encodeFreezeRequest(validRequest, wallet)).toBe(
        `0x82865e9d00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000008${values.paymentReference}000000000000000000000000000000000000000000000000`,
      );
    });
    it('Should encode data to execute initiateEmergencyClaim().', () => {
      expect(encodeInitiateEmergencyClaim(validRequest, wallet)).toBe(
        `0x3a322d4500000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000008${values.paymentReference}000000000000000000000000000000000000000000000000`,
      );
    });
    it('Should encode data to execute completeEmergencyClaim().', () => {
      expect(encodeCompleteEmergencyClaim(validRequest, wallet)).toBe(
        `0x6662e1e000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000008${values.paymentReference}000000000000000000000000000000000000000000000000`,
      );
    });
    it('Should encode data to execute revertEmergencyClaim().', () => {
      expect(encodeRevertEmergencyClaim(validRequest, wallet)).toBe(
        `0x0797560800000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000008${values.paymentReference}000000000000000000000000000000000000000000000000`,
      );
    });
    it('Should encode data to execute refundFrozenFunds().', () => {
      expect(encodeRefundFrozenFunds(validRequest, wallet)).toBe(
        `0x1a77f53a00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000008${values.paymentReference}000000000000000000000000000000000000000000000000`,
      );
    });
    it('should encode data to execute disputeMapping().', () => {
      expect(encodeRequestMapping(validRequest, wallet)).toBe(
        `0xa58ad6bc00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000008${values.paymentReference}000000000000000000000000000000000000000000000000`,
      );
    });
  });

  describe('test function calls:', () => {
    it('Should check if proxy is approved to spend funds', async () => {
      expect(await hasErc20Approval(validRequest, payerAddress)).toBeTruthy;
    });
    /* 
    it('Should transfer the amount and fee', async () => {
      const payerBeforeBalance = await getErc20Balance(validRequest, payerAddress);
      const escrowBeforeBalance = await getErc20Balance(validRequest, escrowAddress);
      const feeBeforeBalance = await getErc20Balance(validRequest, feeAddress);
      
      const transactionTx = await payEscrow(validRequest, wallet, undefined, undefined, {
        gasPrice: '20000000000',
      });
      
      await transactionTx.wait(1);

      const payerAfterBalance = await getErc20Balance(validRequest, payerAddress);
      const escrowAfterBalance = await getErc20Balance(validRequest, escrowAddress);
      const feeAfterBalance = await getErc20Balance(validRequest, feeAddress);

      // ERC20 balance should be lower.
      expect(
        BigNumber.from(payerAfterBalance).eq(BigNumber.from(payerBeforeBalance).sub(102)),
      ).toBeTruthy();

      // fee ERC20 balance should be higher.
      expect(
        BigNumber.from(feeAfterBalance).eq(BigNumber.from(feeBeforeBalance).add(2)),
      ).toBeTruthy();

      // escrow Erc20 balance should be higher.
      expect(
        BigNumber.from(escrowAfterBalance).eq(BigNumber.from(escrowBeforeBalance).add(2)),
      ).toBeTruthy();
    });
    const approvalTx = await approveErc20(validRequest);
    const result = await approvalTx.wait(1);
    // Check if user has enough funds
    if (!(await hasSufficientFunds(validRequest, account))) {
      throw new Error('You do not have enough funds to pay this request');
    } */
  });
});
