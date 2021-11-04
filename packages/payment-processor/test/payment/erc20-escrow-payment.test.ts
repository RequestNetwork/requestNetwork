import { Wallet, providers } from 'ethers';
import {
  ClientTypes,
  ExtensionTypes,
  IdentityTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
//import Utils from '@requestnetwork/utils';
import { encodePayEscrow } from '../../src/payment/erc20-escrow-payment';
import { getAmountToPay, getRequestPaymentValues, } from '../../src/payment/utils';
//import { approveErc20, getErc20Balance } from '../../src/payment/erc20';
import { erc20EscrowToPayArtifact } from '@requestnetwork/smart-contracts';


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

const escrowAddress = erc20EscrowToPayArtifact.getAddress(validRequest.currencyInfo.network!); 

const { paymentReference } = getRequestPaymentValues(validRequest);
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
    it('Should return encoded data payEscrow', async () => {
        expect(encodePayEscrow(validRequest, wallet))
        .toBe(
          `0x325a00f00000000000000000000000009fbda871d559710256a2502a2517b794b482db40000000000000000000000000f17f52151ebef6c7334fad080c5704d77216b732000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000002000000000000000000000000c5fdf4076b8f3a5357c5e395ab970b5b54098fef0000000000000000000000000000000000000000000000000000000000000008${paymentReference}000000000000000000000000000000000000000000000000`
        );
    })
  });
/*
    it('Should return encoded data withdrawFunds', async () => {
      expect(encodePayRequestFromEscrow(validRequest, wallet))
        .toBe(
          `0x3b56da6900000000000000000000000000000000000000000000000000000000000000200000000000000000
          000000000000000000000000000000000000000000000008${paymentReference}000000000000000000000000
          000000000000000000000000`
        );
    });
  });

  describe('*EXECUTE: PayEscrow()', () => {
    it('Should throw an error if the request is not erc20', async () => {
      const request = Utils.deepCopy(validRequest) as ClientTypes.IRequestData;
      request.currencyInfo.type = RequestLogicTypes.CURRENCY.ETH;
  
      await expect(payEscrow(request, wallet)).rejects.toThrowError(
        "request cannot be processed, or is not an pn-erc20-fee-proxy-contract request"
      );
    });
    it('Should throw an error if the currencyInfo has no value', async () => {
      const request = Utils.deepCopy(validRequest);
      request.currencyInfo.value = '';
      await expect(payEscrow(request, wallet)).rejects.toThrowError(
        "request cannot be processed, or is not an pn-erc20-fee-proxy-contract request"
      );
    });
    it('Should throw an error if currencyInfo has no network', async () => {
      const request = Utils.deepCopy(validRequest);
      request.currencyInfo.network = '';
      await expect(payEscrow(request, wallet)).rejects.toThrowError(
        "request cannot be processed, or is not an pn-erc20-fee-proxy-contract request",
      );
    });
    it('Should throw an error if request has no extension', async () => {
      const request = Utils.deepCopy(validRequest);
      request.extensions = [] as any;
  
      await expect(payEscrow(request, wallet)).rejects.toThrowError(
        'no payment network found',
      );
    });
    it('Should consider override parameters', async () => {
      const spy = jest.fn();
      const originalSendTransaction = wallet.sendTransaction.bind(wallet);
      wallet.sendTransaction = spy;
      await payEscrow(validRequest, wallet);
      
      expect(spy).toHaveBeenCalledWith({
        data:
        `0x9a509c3e0000000000000000000000009fbda871d559710256a2502a2517b794b482db
        4000000000000000000000000000000000000000000000000000000000000000640000000
        00000000000000000f17f52151ebef6c7334fad080c5704d77216b7320000000000000000
        0000000000000000000000000000000000000000000000c00000000000000000000000000
        000000000000000000000000000000000000002000000000000000000000000c5fdf4076b
        8f3a5357c5e395ab970b5b54098fef0000000000000000000000000000000000000000000
        000000000000000000008${paymentReference}000000000000000000000000000000000
        000000000000000`,
        gasPrice: '20000000000',
        to: '0xF08dF3eFDD854FEDE77Ed3b2E515090EEe765154',
        value: 0,
      });
      wallet.sendTransaction = originalSendTransaction;
    });
    it('Should let the payer to initAndDeposit an new MyEscrow', async () => {
      const values = getRequestPaymentValues(validRequest);
    
      // first approve the contract
      const approvalTx = await approveErc20(validRequest, wallet);
      if(approvalTx) {
        await approvalTx.wait(1);
      };
      
      // Get the balance to compare after payment
      const payerBalanceErc20Before = await getErc20Balance(validRequest, wallet.address, provider);
      const payeeBalanceErc20Before = await getErc20Balance(validRequest, values.paymentAddress, provider);
      const EscrowBalanceErc20Before = await getErc20Balance(validRequest, escrowAddress, provider);
      
      // Execute the initAndDeposit function call
      expect(await payEscrow(validRequest, wallet));
      
      // Get the balance to compare after payment
      const payerBalanceErc20After = await getErc20Balance(validRequest, wallet.address, provider);
      const payeeBalanceErc20After = await getErc20Balance(validRequest, values.paymentAddress, provider);
      const EscrowBalanceErc20After = await getErc20Balance(validRequest, escrowAddress, provider);

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
      const values = getRequestPaymentValues(validRequest);
      // get the balance to compare after payment
      const payerBalanceErc20Before = await getErc20Balance(validRequest, wallet.address, provider);
      const payeeBalanceErc20Before = await getErc20Balance(validRequest, values.paymentAddress, provider);
      const EscrowBalanceErc20Before = await getErc20Balance(validRequest, escrowAddress, provider);
      const FeeBalanceErc20Before = await getErc20Balance(validRequest, feeAddress, provider);
      
      await payRequestFromEscrow(validRequest, wallet);
      
      const payerBalanceErc20After = await getErc20Balance(validRequest, wallet.address, provider);
      const payeeBalanceErc20After = await getErc20Balance(validRequest, values.paymentAddress, provider);
      const EscrowBalanceErc20After = await getErc20Balance(validRequest, escrowAddress, provider);
      const FeeBalanceErc20After = await getErc20Balance(validRequest, feeAddress, provider);
      
      console.log(`
      --------    Ref: 0x${values.paymentReference} : WithdrawFundsRequest    ---------
      
      Escrow Address            :                ${escrowAddress},
      WalletAddress             :                ${wallet.address},
      PayeeAddress              :                ${values.paymentAddress},
      FeeAddress                :                ${feeAddress}

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

  describe('*EXECUTE: freezeRequest: ', () => {
    it('should freeze funds for one year', async () => {

      // Initiates a new escrow
      await (await payEscrow(validRequest, wallet)).wait(1);
     
      // Lock the escrowed funds in a new TokenTimeLock contract 
      await (await freezeRequest(validRequest, wallet)).wait(1);
     
    });
    //it('should return the disputeMapping: ', async () => {
    //  await disputeMappingRequest(validRequest, wallet);
    //});
    it('should withdraw and transfer the timelocked funds to the payer: ', async () => {
        const values = getRequestPaymentValues(validRequest);
        // get the balance to compare after payment
        const payerBalanceErc20Before = await getErc20Balance(validRequest, wallet.address, provider);
        const payeeBalanceErc20Before = await getErc20Balance(validRequest, values.paymentAddress, provider);
        const EscrowBalanceErc20Before = await getErc20Balance(validRequest, escrowAddress, provider);
        const FeeBalanceErc20Before = await getErc20Balance(validRequest, feeAddress, provider);
        
        await payRequestFromEscrow(validRequest, wallet);
        
        const payerBalanceErc20After = await getErc20Balance(validRequest, wallet.address, provider);
        const payeeBalanceErc20After = await getErc20Balance(validRequest, values.paymentAddress, provider);
        const EscrowBalanceErc20After = await getErc20Balance(validRequest, escrowAddress, provider);
        const FeeBalanceErc20After = await getErc20Balance(validRequest, feeAddress, provider);
        
  
      console.log(`
      --------    Ref: 0x${values.paymentReference} : withdrawLockedFundsRequest   ---------
    
      Escrow Address            :                ${escrowAddress},
      Payer Address             :                ${wallet.address},
      Payee Address             :                ${paymentAddress},
      Fee Address               :                ${feeAddress}

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
*/
});