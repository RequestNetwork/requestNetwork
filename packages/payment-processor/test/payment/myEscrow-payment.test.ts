import { Wallet, providers } from 'ethers';
import {
  ClientTypes,
  ExtensionTypes,
  IdentityTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import {
  withdrawFundsRequest,
  initAndDepositRequest,
  encodeWithdrawFundsRequest,
  encodeInitAndDepositRequest,
  initLockPeriodRequest,
  withdrawLockedFundsRequest,
  disputeMappingRequest,
} from '../../src/payment/myEscrow-payment';
import { getAmountToPay, getRequestPaymentValues, } from '../../src/payment/utils';
import { approveErc20, getErc20Balance } from '../../src/payment/erc20';
import { myEscrowArtifact } from '../../../smart-contracts/dist/src/lib';


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
    [PaymentTypes.PAYMENT_NETWORK_ID.ERC20_TIME_LOCKED_ESCROW]: {
      events: [],
      id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_TIME_LOCKED_ESCROW,
      type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
      values: {
        feeAddress,
        feeAmount: '2',
        paymentAddress,
        salt: 'salt'+Math.floor(Math.random()*10000000),
      },
      version: '1.0',
    },
  },
  extensionsData: [],
  meta: {
    transactionManagerMeta: {},
  },
  pending: null,
  requestId: 'abcd',
  state: RequestLogicTypes.STATE.CREATED,
  timestamp: 0,  version: '1.0',
};

const escrowAddress = myEscrowArtifact.getAddress(validRequest.currencyInfo.network!); 

let { paymentReference } = getRequestPaymentValues(validRequest);
describe('*CONTRACT: MyEscrow.sol', () => {
  beforeEach( () => {
    jest.restoreAllMocks();

  });

  describe('*TEST REQUESTED PAYMENT VALUES:', () => {
    it('- Should return the correct payment values:', async () => {
      const values = getRequestPaymentValues(validRequest);
      expect(values.feeAddress).toBe(feeAddress);
      expect(values.feeAmount).toBe('2');
      expect(values.paymentAddress).toBe(paymentAddress);
      expect(values.paymentReference).toBe(paymentReference);
 
      console.log(`
      ---MyEscrow-payments:---
          RequestPaymentValues:
            * PaymentReference         :               0x${values.paymentReference}
            *
            * ERC20 PaymentToken       :               ${erc20ContractAddress},
            * Escrow Address           :               ${escrowAddress},
            * Payer Address            :               ${wallet.address},
            * Payee Address            :               ${values.paymentAddress},
            * Fee Address              :               ${values.feeAddress}
            * 
            * AmountToPay              :               ${getAmountToPay(validRequest)},
            * FeeAmount                :               ${values.feeAmount}
            * 
            * Network                  :               ${validRequest.currencyInfo.network}
          `);
    });
  });

  describe('*ENCODE REQUESTED PAYMENT VALUES:', () => {
    it('Should return encoded data initAndDeposit', async () => {
      expect(encodeInitAndDepositRequest(validRequest, wallet)).toBe(`0x9a509c3e0000000000000000000000009fbda871d559710256a2502a2517b794b482db400000000000000000000000000000000000000000000000000000000000000064000000000000000000000000f17f52151ebef6c7334fad080c5704d77216b73200000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000002000000000000000000000000c5fdf4076b8f3a5357c5e395ab970b5b54098fef0000000000000000000000000000000000000000000000000000000000000008${paymentReference}000000000000000000000000000000000000000000000000`);
    });
    it('Should return encoded data withdrawFunds', async () => {
      expect(encodeWithdrawFundsRequest(validRequest, wallet)).toBe(`0x3b56da6900000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000008${paymentReference}000000000000000000000000000000000000000000000000`);
    });
  });

  describe('*EXECUTE: initAndDepositRequest', () => {
    it('Should throw an error if the request is not erc20', async () => {
      const request = Utils.deepCopy(validRequest) as ClientTypes.IRequestData;
      request.currencyInfo.type = RequestLogicTypes.CURRENCY.ETH;
  
      await expect(initAndDepositRequest(request, wallet)).rejects.toThrowError(
        'request cannot be processed, or is not an pn-erc20-time-lock-escrow request',
      );
    });
    it('Should throw an error if the currencyInfo has no value', async () => {
      const request = Utils.deepCopy(validRequest);
      request.currencyInfo.value = '';
      await expect(initAndDepositRequest(request, wallet)).rejects.toThrowError(
        'request cannot be processed, or is not an pn-erc20-time-lock-escrow request',
      );
    });
    it('Should throw an error if currencyInfo has no network', async () => {
      const request = Utils.deepCopy(validRequest);
      request.currencyInfo.network = '';
      await expect(initAndDepositRequest(request, wallet)).rejects.toThrowError(
        'request cannot be processed, or is not an pn-erc20-time-lock-escrow request',
      );
    });
    it('Should throw an error if request has no extension', async () => {
      const request = Utils.deepCopy(validRequest);
      request.extensions = [] as any;
  
      await expect(initAndDepositRequest(request, wallet)).rejects.toThrowError(
        'no payment network found',
      );
    });
    it('Should consider override parameters', async () => {
      const spy = jest.fn();
      const originalSendTransaction = wallet.sendTransaction.bind(wallet);
      wallet.sendTransaction = spy;
      await initAndDepositRequest(validRequest, wallet, {
        gasPrice: '20000000000',
      });
      
      expect(spy).toHaveBeenCalledWith({
        data:
          `0x9a509c3e0000000000000000000000009fbda871d559710256a2502a2517b794b482db400000000000000000000000000000000000000000000000000000000000000064000000000000000000000000f17f52151ebef6c7334fad080c5704d77216b73200000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000002000000000000000000000000c5fdf4076b8f3a5357c5e395ab970b5b54098fef0000000000000000000000000000000000000000000000000000000000000008${paymentReference}000000000000000000000000000000000000000000000000`,
        gasPrice: '20000000000',
        to: '0xF08dF3eFDD854FEDE77Ed3b2E515090EEe765154',
        value: 0,
      });
      wallet.sendTransaction = originalSendTransaction;
    });
    it('Should let the payer to initAndDeposit an new MyEscrow', async () => {
      const request = Utils.deepCopy(validRequest);
      let values = getRequestPaymentValues(request);
    
      // first approve the contract
      const approvalTx = await approveErc20(request, wallet);
      if(approvalTx) {
        await approvalTx.wait(1);
      };
      
      // Get the balance to compare after payment
      const payerBalanceErc20Before = await getErc20Balance(request, wallet.address, provider);
      const payeeBalanceErc20Before = await getErc20Balance(request, values.paymentAddress, provider);
      const EscrowBalanceErc20Before = await getErc20Balance(request, escrowAddress, provider);
      
      // Execute the initAndDeposit function call
      expect(await initAndDepositRequest(request, wallet));
      
      // Get the balance to compare after payment
      const payerBalanceErc20After = await getErc20Balance(request, wallet.address, provider);
      const payeeBalanceErc20After = await getErc20Balance(request, values.paymentAddress, provider);
      const EscrowBalanceErc20After = await getErc20Balance(request, escrowAddress, provider);

      console.log(`
      --------   Ref: 0x${values.paymentReference} : InitAndDepositRequest ---------
      
      Escrow Address            :                ${escrowAddress},
      Payer Address             :                ${wallet.address},
      Payee Address             :                ${values.paymentAddress},
      AmountToPay               :                ${getAmountToPay(validRequest)}  

      Payer  Balance Before     :                ${payerBalanceErc20Before},
      Payee  Balance Before     :                ${payeeBalanceErc20Before},
      Escrow Balance Before     :                ${EscrowBalanceErc20Before}

      Payer  Balance After      :                ${payerBalanceErc20After},
      Payee  Balance After      :                ${payeeBalanceErc20After},
      Escrow Balance After      :                ${EscrowBalanceErc20After}

      `);
    });
  });
  
  describe('*EXECUTE: WithdrawFundsRequest: ', () => {
    it('should Withdraw funds from the MyEscrow: ', async () => {
      const request = Utils.deepCopy(validRequest);
      const values = getRequestPaymentValues(validRequest);
      // get the balance to compare after payment
      const payerBalanceErc20Before = await getErc20Balance(request, wallet.address, provider);
      const payeeBalanceErc20Before = await getErc20Balance(request, values.paymentAddress, provider);
      const EscrowBalanceErc20Before = await getErc20Balance(request, escrowAddress, provider);
      const FeeBalanceErc20Before = await getErc20Balance(request, values.feeAddress, provider);
      
      await withdrawFundsRequest(validRequest, wallet);
      
      const payerBalanceErc20After = await getErc20Balance(request, wallet.address, provider);
      const payeeBalanceErc20After = await getErc20Balance(request, values.paymentAddress, provider);
      const EscrowBalanceErc20After = await getErc20Balance(request, escrowAddress, provider);
      const FeeBalanceErc20After = await getErc20Balance(request, values.feeAddress, provider);
      
      console.log(`
      --------    Ref: 0x${values.paymentReference} : WithdrawFundsRequest    ---------
      
      Escrow Address            :                ${escrowAddress},
      WalletAddress             :                ${wallet.address},
      PayeeAddress              :                ${values.paymentAddress},
      FeeAddress                :                ${values.feeAddress}

      FeeAmount                 :                ${values.feeAmount},
      AmountToPay               :                ${getAmountToPay(validRequest)}

      Payer  Balance Before     :                ${payerBalanceErc20Before},
      Payee  Balance Before     :                ${payeeBalanceErc20Before},
      Escrow Balance Before     :                ${EscrowBalanceErc20Before},
      Fee Balance Before        :                ${FeeBalanceErc20Before}

      Payer  Balance After      :                ${payerBalanceErc20After},
      Payee  Balance After      :                ${payeeBalanceErc20After},
      Escrow Balance After      :                ${EscrowBalanceErc20After},
      Fee Balance After         :                ${FeeBalanceErc20After}

      `);
    });
  });

  describe('*EXECUTE: InitLockedPeriodRequest: ', () => {
    it('should add to disputeMapping and create a new TokenTimelockContract: ', async () => {
      const request = Utils.deepCopy(validRequest);
      // Initiates a new escrow
      await (await initAndDepositRequest(request, wallet)).wait(1);
     
      // Lock the escrowed funds in a new TokenTimeLock contract 
      await (await initLockPeriodRequest(request, wallet)).wait(1);
     
    });
    it('should return the disputeMapping: ', async () => {
      await disputeMappingRequest(validRequest, wallet);
    });
    it('should withdraw and transfer the timelocked funds to the payer: ', async () => {
      const values = getRequestPaymentValues(validRequest)
      const payerBalanceErc20Before = await getErc20Balance(validRequest, wallet.address, provider);
      const payeeBalanceErc20Before = await getErc20Balance(validRequest, values.paymentAddress, provider);
      const EscrowBalanceErc20Before = await getErc20Balance(validRequest, escrowAddress, provider);
      const FeeBalanceErc20Before = await getErc20Balance(validRequest, values.feeAddress, provider);

      // Initiates a new escrow
      await withdrawLockedFundsRequest(validRequest, wallet);
    
      const payerBalanceErc20After = await getErc20Balance(validRequest, wallet.address, provider);
      const payeeBalanceErc20After = await getErc20Balance(validRequest, values.paymentAddress, provider);
      const EscrowBalanceErc20After = await getErc20Balance(validRequest, escrowAddress, provider);
      const FeeBalanceErc20After = await getErc20Balance(validRequest, values.feeAddress, provider);
  
      console.log(`
      --------    Ref: 0x${values.paymentReference} : withdrawLockedFundsRequest   ---------
    
      Escrow Address            :                ${escrowAddress},
      Payer Address             :                ${wallet.address},
      Payee Address             :                ${values.paymentAddress},
      Fee Address               :                ${values.feeAddress}

      AmountToPay               :                ${getAmountToPay(validRequest)}, 
      FeeAmount:                                 ${values.feeAmount}

      Payer  Balance Before     :                ${payerBalanceErc20Before},
      Payee  Balance Before     :                ${payeeBalanceErc20Before},
      Escrow Balance Before     :                ${EscrowBalanceErc20Before},
      Fee Balance Before        :                ${FeeBalanceErc20Before}

      Payer  Balance After      :                ${payerBalanceErc20After},
      Payee  Balance After      :                ${payeeBalanceErc20After},
      Escrow Balance After      :                ${EscrowBalanceErc20After},
      Fee Balance After         :                ${FeeBalanceErc20After}
      `);
    });
  });

});




  
  /*
  it('should throw an error if the currencyInfo has no value', async () => {
      const request = Utils.deepCopy(validRequest);
      request.currencyInfo.value = '';
      await expect(payErc20FeeProxyRequest(request, wallet)).rejects.toThrowError(
        'request cannot be processed, or is not an pn-erc20-fee-proxy-contract request',
      );
    });

    it('should throw an error if currencyInfo has no network', async () => {
      const request = Utils.deepCopy(validRequest);
      request.currencyInfo.network = '';
      await expect(payErc20FeeProxyRequest(request, wallet)).rejects.toThrowError(
        'request cannot be processed, or is not an pn-erc20-fee-proxy-contract request',
      );
    });

    it('should throw an error if request has no extension', async () => {
      const request = Utils.deepCopy(validRequest);
      request.extensions = [] as any;

      await expect(payErc20FeeProxyRequest(request, wallet)).rejects.toThrowError(
        'no payment network found',
      );
    });
  });
  describe('payErc20FeeProxyRequest', () => {
    it('should consider override parameters', async () => {
      const spy = jest.fn();
      const originalSendTransaction = wallet.sendTransaction.bind(wallet);
      wallet.sendTransaction = spy;
      await payErc20FeeProxyRequest(validRequest, wallet, undefined, undefined, {
        gasPrice: '20000000000',
      });
      expect(spy).toHaveBeenCalledWith({
        data:
        `0xc219a14d0000000000000000000000009fbda871d559710256a2502a2517b794b482db40000000000000000000000000f17f52151ebef6c7334fad080c5704d77216b732000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000002000000000000000000000000c5fdf4076b8f3a5357c5e395ab970b5b54098fef0000000000000000000000000000000000000000000000000000000000000008${paymentReference}000000000000000000000000000000000000000000000000`,
        gasPrice: '20000000000',
        to: '0xF08dF3eFDD854FEDE77Ed3b2E515090EEe765154',
        value: 0,
      });
      wallet.sendTransaction = originalSendTransaction;
    });
    
    it('should pay an ERC20 request with fees', async () => {
      // first approve the contract
      await approveErc20(validRequest, wallet);
      
      
      // get the balance to compare after payment
      
      const balanceEthBefore = await wallet.getBalance();
      const balanceErc20Before = await getErc20Balance(validRequest, wallet.address, provider);
      const feeBalanceErc20Before = await getErc20Balance(validRequest, feeAddress, provider);
      
      const tx = await payErc20FeeProxyRequest(validRequest, wallet);
      const confirmedTx = await tx.wait(1);
      
      const balanceEthAfter = await wallet.getBalance();
      const balanceErc20After = await getErc20Balance(validRequest, wallet.address, provider);
      const feeBalanceErc20After = await getErc20Balance(validRequest, feeAddress, provider);
      
      expect(confirmedTx.status).toBe(1);
      expect(tx.hash).not.toBeUndefined();
      
      expect(balanceEthAfter.lte(balanceEthBefore)).toBeTruthy(); // 'ETH balance should be lower'
      
      // ERC20 balance should be lower
      expect(
        BigNumber.from(balanceErc20After).eq(BigNumber.from(balanceErc20Before).sub(102)),
        ).toBeTruthy();
        // fee ERC20 balance should be higher
        expect(
          BigNumber.from(feeBalanceErc20After).eq(BigNumber.from(feeBalanceErc20Before).add(2)),
          ).toBeTruthy();
        });
      });
      
      */
  
