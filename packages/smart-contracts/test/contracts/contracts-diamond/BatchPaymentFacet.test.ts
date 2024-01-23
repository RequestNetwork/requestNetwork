import { ethers, network } from 'hardhat';
import {
  AggregatorMock__factory,
  DiamondBatchFacet,
  DiamondBatchFacet__factory,
  DiamondChainlinkConversionFacet,
  DiamondChainlinkConversionFacet__factory,
  DiamondPaymentConversionFacet,
  DiamondPaymentConversionFacet__factory,
  DiamondPaymentFacet,
  DiamondPaymentFacet__factory,
  ERC20,
  ERC20FeeProxy,
  ERC20FeeProxy__factory,
  ERC20__factory,
  EtherPaymentFallback,
  EtherPaymentFallback__factory,
  GnosisSafeProxy,
  GnosisSafeProxy__factory,
  TestERC20,
  TestERC20__factory,
} from '../../../src/types';
import { BigNumber, Signer } from 'ethers';
import { expect, use } from 'chai';
import { solidity } from 'ethereum-waffle';
import { CurrencyManager, EvmChains } from '@requestnetwork/currency';
import { deployDiamondAndFacets } from '../../../scripts-diamond/deploy';
import { ERC20Addresses, setupERC20 } from '../../../scripts-diamond/setup/setupERC20';
import { setupChainlinkFacet } from '../../../scripts-diamond/setup/setupChainlinkConversionPath';
import { HttpNetworkConfig } from 'hardhat/types';

use(solidity);

describe('Contract: BatchPaymentFacet', () => {
  let diamondAddress: string;
  let from: string;
  let to: string;
  let feeAddress: string;
  let signer: Signer;
  let toSigner: Signer;
  let erc20Adresses: ERC20Addresses;
  const amount = '100';
  const feeAmount = '2';
  const amountInFiat = '100000000'; // 1 with 8 decimal
  const feesAmountInFiat = '10000000'; // 0.1 with 8 decimal
  const thousandWith18Decimal = '1000000000000000000000';
  const hundredWith18Decimal = '100000000000000000000';
  const referenceExample = '0xaaaa';

  const currencyManager = CurrencyManager.getDefault();

  const abiCoder = new ethers.utils.AbiCoder();
  const ETH_hash = currencyManager.fromSymbol('ETH-private')!.hash;
  const USD_hash = currencyManager.fromSymbol('USD')!.hash;
  const EUR_hash = currencyManager.fromSymbol('EUR')!.hash;
  let DAI_address: string;

  let testERC20: ERC20;
  let chainlinkFacet: DiamondChainlinkConversionFacet;
  let paymentFacet: DiamondPaymentFacet;
  let paymentConversionFacet: DiamondPaymentConversionFacet;
  let batchPaymentFacet: DiamondBatchFacet;
  let gnosisSafeProxy: GnosisSafeProxy;
  let etherPaymentFallback: EtherPaymentFallback;
  let oldPaymentProxy: ERC20FeeProxy;
  const provider = new ethers.providers.JsonRpcProvider((network.config as HttpNetworkConfig).url);

  before(async () => {
    EvmChains.assertChainSupported(network.name);
    [from, to, feeAddress] = (await ethers.getSigners()).map((s) => s.address);
    [signer, toSigner] = await ethers.getSigners();
    diamondAddress = await deployDiamondAndFacets();
    erc20Adresses = await setupERC20();
    chainlinkFacet = DiamondChainlinkConversionFacet__factory.connect(diamondAddress, signer);
    await setupChainlinkFacet(chainlinkFacet, erc20Adresses);
    paymentConversionFacet = DiamondPaymentConversionFacet__factory.connect(diamondAddress, signer);
    paymentFacet = DiamondPaymentFacet__factory.connect(diamondAddress, signer);
    batchPaymentFacet = DiamondBatchFacet__factory.connect(diamondAddress, signer);

    oldPaymentProxy = await new ERC20FeeProxy__factory(signer).deploy();

    DAI_address = erc20Adresses.ERC20TestAddress;

    // Gnosis Safe specific deployments
    etherPaymentFallback = await new EtherPaymentFallback__factory(signer).deploy();
    gnosisSafeProxy = await new GnosisSafeProxy__factory(signer).deploy(
      etherPaymentFallback.address,
    );
  });

  describe('Batch Native Payments', () => {
    it('Should pay 10 ETH payments', async () => {
      const toOldBalance = await provider.getBalance(to);
      const feeOldBalance = await provider.getBalance(feeAddress);

      const singlePaymentData = paymentFacet.interface.encodeFunctionData(
        'exactNativeTransferWithFees',
        [to, amount, referenceExample, feeAmount, feeAddress],
      );
      const singleBatchPayment = {
        proxy: diamondAddress,
        operation: 0,
        paymentData: singlePaymentData,
      };
      const batchPayment = Array(10).fill(singleBatchPayment);

      const tx = await batchPaymentFacet.batchPay(batchPayment, [], {
        value: '11000', // Required amount + fees = 1020 (10 * 100 + 10 * 2)
      });
      await tx.wait(1);

      const toNewBalance = await provider.getBalance(to);
      const feeAddressNewBalance = await provider.getBalance(feeAddress);
      const contractBalance = await provider.getBalance(paymentFacet.address);

      // Check balance changes
      expect(toNewBalance.toString()).to.equals(toOldBalance.add('1000').toString());
      expect(feeAddressNewBalance.toString()).to.equals(feeOldBalance.add('20').toString());
      expect(contractBalance.toString()).to.equals('0');
    });

    it('Should pay 10 ETH payments with conversion', async () => {
      const path = [USD_hash, ETH_hash];
      const conversionToPay = await chainlinkFacet.getConversion(amountInFiat, path);
      const conversionFees = await chainlinkFacet.getConversion(feesAmountInFiat, path);

      const toOldBalance = await provider.getBalance(to);
      const feeOldBalance = await provider.getBalance(feeAddress);

      const singlePaymentData = paymentConversionFacet.interface.encodeFunctionData(
        'nativeTransferWithConversion',
        [to, amountInFiat, path, referenceExample, feesAmountInFiat, feeAddress, 0],
      );
      const singleBatchPayment = {
        proxy: diamondAddress,
        operation: 0,
        paymentData: singlePaymentData,
      };
      const batchPayment = Array(10).fill(singleBatchPayment);

      const tx = await batchPaymentFacet.batchPay(batchPayment, [], {
        value: conversionToPay.result.add(conversionFees.result).mul(10).add(1000),
      });
      await tx.wait(1);

      const toNewBalance = await provider.getBalance(to);
      const feeAddressNewBalance = await provider.getBalance(feeAddress);
      const contractBalance = await provider.getBalance(paymentFacet.address);

      // Check balance changes
      expect(toNewBalance.toString()).to.equals(
        toOldBalance.add(conversionToPay.result.mul(10)).toString(),
      );
      expect(feeAddressNewBalance.toString()).to.equals(
        feeOldBalance.add(conversionFees.result.mul(10)).toString(),
      );
      expect(contractBalance.toString()).to.equals('0');
    });

    it('Should fail if the encoding operation is DELEGATECALL', async () => {
      const singlePaymentData = paymentFacet.interface.encodeFunctionData(
        'exactNativeTransferWithFees',
        [to, amount, referenceExample, feeAmount, feeAddress],
      );
      const singleBatchPayment = {
        proxy: diamondAddress,
        operation: 1,
        paymentData: singlePaymentData,
      };
      const batchPayment = Array(10).fill(singleBatchPayment);

      await expect(
        batchPaymentFacet.batchPay(batchPayment, [], {
          value: '11000', // Required amount + fees = 1020 (10 * 100 + 10 * 2)
        }),
      ).to.be.revertedWith('One of the payment failed');
    });
  });

  describe('Batch Token Payments', () => {
    // Before each test make an approval
    beforeEach(async () => {
      testERC20 = ERC20__factory.connect(DAI_address, signer);
      await testERC20.approve(diamondAddress, thousandWith18Decimal);
    });

    // After each test send all funds from "to" to "from"
    afterEach(async () => {
      testERC20 = testERC20.connect(toSigner);
      const toFinalBalance = await testERC20.balanceOf(to);
      await testERC20.transfer(from, toFinalBalance);
      testERC20 = testERC20.connect(signer);
    });

    it('Should pay 10 ERC20 payments', async () => {
      const fromOldBalance = await testERC20.balanceOf(from);
      const toOldBalance = await testERC20.balanceOf(to);
      const feeOldBalance = await testERC20.balanceOf(feeAddress);

      const singlePaymentData = paymentFacet.interface.encodeFunctionData('tokenTransferWithFees', [
        testERC20.address,
        to,
        amount,
        referenceExample,
        feeAmount,
        feeAddress,
      ]);
      const singleBatchPayment = {
        proxy: diamondAddress,
        operation: 1,
        paymentData: singlePaymentData,
      };
      const batchPayment = Array(10).fill(singleBatchPayment);

      const batchTotals = [
        {
          proxy: diamondAddress,
          paymentCurrency: testERC20.address,
          amount: '1020',
        },
      ];

      const tx = await batchPaymentFacet.batchPay(batchPayment, batchTotals);
      await tx.wait(1);

      const fromNewBalance = await testERC20.balanceOf(from);
      const toNewBalance = await testERC20.balanceOf(to);
      const feeNewBalance = await testERC20.balanceOf(feeAddress);
      const contractBalance = await testERC20.balanceOf(paymentFacet.address);

      // Check balance changes
      expect(fromNewBalance.toString()).to.equals(fromOldBalance.sub('1020').toString());
      expect(toNewBalance.toString()).to.equals(toOldBalance.add('1000').toString());
      expect(feeNewBalance.toString()).to.equals(feeOldBalance.add('20').toString());
      expect(contractBalance.toString()).to.equals('0');
    });

    it('Should pay 10 ERC20 payments with conversion', async () => {
      const path = [USD_hash, DAI_address];

      const fromOldBalance = await testERC20.balanceOf(from);
      const toOldBalance = await testERC20.balanceOf(to);
      const feeOldBalance = await testERC20.balanceOf(feeAddress);
      const conversionToPay = await chainlinkFacet.getConversion(amountInFiat, path);
      const conversionFees = await chainlinkFacet.getConversion(feesAmountInFiat, path);

      const singlePaymentData = paymentConversionFacet.interface.encodeFunctionData(
        'tokenTransferWithConversion',
        [
          to,
          amountInFiat,
          path,
          referenceExample,
          feesAmountInFiat,
          feeAddress,
          hundredWith18Decimal,
          0,
        ],
      );
      const singleBatchPayment = {
        proxy: diamondAddress,
        operation: 1,
        paymentData: singlePaymentData,
      };
      const batchPayment = Array(10).fill(singleBatchPayment);

      const batchTotals = [
        {
          proxy: diamondAddress,
          paymentCurrency: testERC20.address,
          amount: conversionToPay.result.add(conversionFees.result).mul(10).toString(),
        },
      ];

      const tx = await batchPaymentFacet.batchPay(batchPayment, batchTotals);
      await tx.wait(1);

      const fromNewBalance = await testERC20.balanceOf(from);
      const toNewBalance = await testERC20.balanceOf(to);
      const feeNewBalance = await testERC20.balanceOf(feeAddress);
      const contractBalance = await testERC20.balanceOf(paymentFacet.address);

      // Check balance changes
      expect(fromNewBalance.toString()).to.equals(
        fromOldBalance.sub(conversionToPay.result.add(conversionFees.result).mul(10)).toString(),
      );
      expect(toNewBalance.toString()).to.equals(
        toOldBalance.add(conversionToPay.result.mul(10)).toString(),
      );
      expect(feeNewBalance.toString()).to.equals(
        feeOldBalance.add(conversionFees.result.mul(10)).toString(),
      );
      expect(contractBalance.toString()).to.equals('0');
    });

    it('Should fail if the encoding operation is CALL - with non-null msg.value', async () => {
      const path = [USD_hash, DAI_address];
      const conversionToPay = await chainlinkFacet.getConversion(amountInFiat, path);
      const conversionFees = await chainlinkFacet.getConversion(feesAmountInFiat, path);

      const singlePaymentData = paymentConversionFacet.interface.encodeFunctionData(
        'tokenTransferWithConversion',
        [
          to,
          amountInFiat,
          path,
          referenceExample,
          feesAmountInFiat,
          feeAddress,
          hundredWith18Decimal,
          0,
        ],
      );
      const singleBatchPayment = {
        proxy: diamondAddress,
        operation: 0,
        paymentData: singlePaymentData,
      };
      const batchPayment = Array(10).fill(singleBatchPayment);

      const batchTotals = [
        {
          proxy: diamondAddress,
          paymentCurrency: testERC20.address,
          amount: conversionToPay.result.add(conversionFees.result).mul(10).toString(),
        },
      ];

      await expect(
        batchPaymentFacet.batchPay(batchPayment, batchTotals, {
          value: 1,
        }),
      ).to.be.revertedWith('One of the payment failed');
    });
  });

  describe('Batch Legacy Proxy', () => {
    // Before each test make an approval
    beforeEach(async () => {
      testERC20 = ERC20__factory.connect(DAI_address, signer);
      await testERC20.approve(diamondAddress, thousandWith18Decimal);
    });

    // After each test send all funds from "to" to "from"
    afterEach(async () => {
      testERC20 = testERC20.connect(toSigner);
      const toFinalBalance = await testERC20.balanceOf(to);
      await testERC20.transfer(from, toFinalBalance);
      testERC20 = testERC20.connect(signer);
    });

    it('Should pay 10 ERC20 payments using legacy proxy', async () => {
      const fromOldBalance = await testERC20.balanceOf(from);
      const toOldBalance = await testERC20.balanceOf(to);
      const feeOldBalance = await testERC20.balanceOf(feeAddress);

      const singlePaymentData = oldPaymentProxy.interface.encodeFunctionData(
        'transferFromWithReferenceAndFee',
        [testERC20.address, to, amount, referenceExample, feeAmount, feeAddress],
      );
      const singleBatchPayment = {
        proxy: oldPaymentProxy.address,
        operation: 1,
        paymentData: singlePaymentData,
      };
      const batchPayment = Array(10).fill(singleBatchPayment);

      const batchTotals = [
        {
          proxy: oldPaymentProxy.address,
          paymentCurrency: testERC20.address,
          amount: '1020',
        },
      ];

      const tx = await batchPaymentFacet.batchPay(batchPayment, batchTotals);
      await tx.wait(1);

      const fromNewBalance = await testERC20.balanceOf(from);
      const toNewBalance = await testERC20.balanceOf(to);
      const feeNewBalance = await testERC20.balanceOf(feeAddress);
      const contractBalance = await testERC20.balanceOf(paymentFacet.address);

      // Check balance changes
      expect(fromNewBalance.toString()).to.equals(fromOldBalance.sub('1020').toString());
      expect(toNewBalance.toString()).to.equals(toOldBalance.add('1000').toString());
      expect(feeNewBalance.toString()).to.equals(feeOldBalance.add('20').toString());
      expect(contractBalance.toString()).to.equals('0');
    });
  });

  describe('Batch Mixed Payments', () => {
    // Before each test make an approval
    beforeEach(async () => {
      testERC20 = ERC20__factory.connect(DAI_address, signer);
      await testERC20.approve(diamondAddress, thousandWith18Decimal);
    });

    // After each test send all funds from "to" to "from"
    afterEach(async () => {
      testERC20 = testERC20.connect(toSigner);
      const toFinalBalance = await testERC20.balanceOf(to);
      await testERC20.transfer(from, toFinalBalance);
      testERC20 = testERC20.connect(signer);
    });

    it('Should mix any kind of payments', async () => {
      const toNativeOldBalance = await provider.getBalance(to);
      const feeNativeOldBalance = await provider.getBalance(feeAddress);
      const fromTokenOldBalance = await testERC20.balanceOf(from);
      const toTokenOldBalance = await testERC20.balanceOf(to);
      const feeTokenOldBalance = await testERC20.balanceOf(feeAddress);

      const nativePath = [USD_hash, ETH_hash];
      const tokenPath = [USD_hash, DAI_address];
      const nativeConversionToPay = await chainlinkFacet.getConversion(amountInFiat, nativePath);
      const nativeConversionFees = await chainlinkFacet.getConversion(feesAmountInFiat, nativePath);
      const tokenConversionToPay = await chainlinkFacet.getConversion(amountInFiat, tokenPath);
      const tokenConversionFees = await chainlinkFacet.getConversion(feesAmountInFiat, tokenPath);

      const singleNativePaymentData = paymentFacet.interface.encodeFunctionData(
        'exactNativeTransferWithFees',
        [to, amount, referenceExample, feeAmount, feeAddress],
      );

      const singleNativeConversionPaymentData = paymentConversionFacet.interface.encodeFunctionData(
        'nativeTransferWithConversion',
        [to, amountInFiat, nativePath, referenceExample, feesAmountInFiat, feeAddress, 0],
      );

      const singleTokenPaymentData = paymentFacet.interface.encodeFunctionData(
        'tokenTransferWithFees',
        [testERC20.address, to, amount, referenceExample, feeAmount, feeAddress],
      );

      const singleTokenConversionPaymentData = paymentConversionFacet.interface.encodeFunctionData(
        'tokenTransferWithConversion',
        [
          to,
          amountInFiat,
          tokenPath,
          referenceExample,
          feesAmountInFiat,
          feeAddress,
          hundredWith18Decimal,
          0,
        ],
      );

      const singleLegacyPaymentData = oldPaymentProxy.interface.encodeFunctionData(
        'transferFromWithReferenceAndFee',
        [testERC20.address, to, amount, referenceExample, feeAmount, feeAddress],
      );

      const singleNativeBatchPayment = {
        proxy: diamondAddress,
        operation: 0,
        paymentData: singleNativePaymentData,
      };

      const singleNativeConversionBatchPayment = {
        proxy: diamondAddress,
        operation: 0,
        paymentData: singleNativeConversionPaymentData,
      };

      const singleTokenBatchPayment = {
        proxy: diamondAddress,
        operation: 1,
        paymentData: singleTokenPaymentData,
      };

      const singleTokenConversionBatchPayment = {
        proxy: diamondAddress,
        operation: 1,
        paymentData: singleTokenConversionPaymentData,
      };

      const singleLegacyBatchPayment = {
        proxy: oldPaymentProxy.address,
        operation: 1,
        paymentData: singleLegacyPaymentData,
      };

      const batchPayment = [
        singleNativeBatchPayment,
        singleNativeBatchPayment,
        singleNativeConversionBatchPayment,
        singleNativeConversionBatchPayment,
        singleTokenBatchPayment,
        singleTokenBatchPayment,
        singleTokenConversionBatchPayment,
        singleTokenConversionBatchPayment,
        singleLegacyBatchPayment,
        singleLegacyBatchPayment,
      ];

      const batchTotals = [
        {
          proxy: diamondAddress,
          paymentCurrency: testERC20.address,
          amount: tokenConversionToPay.result
            .add(tokenConversionFees.result)
            .mul(2)
            .add('204')
            .toString(),
        },
        {
          proxy: oldPaymentProxy.address,
          paymentCurrency: testERC20.address,
          amount: '204',
        },
      ];

      const tx = await batchPaymentFacet.batchPay(batchPayment, batchTotals, {
        value: nativeConversionToPay.result.add(nativeConversionFees.result).mul(10).add(1000),
      });
      await tx.wait(1);

      const toNativeNewBalance = await provider.getBalance(to);
      const feeNativeNewBalance = await provider.getBalance(feeAddress);
      const contractNativeBalance = await provider.getBalance(paymentFacet.address);

      const fromTokenNewBalance = await testERC20.balanceOf(from);
      const toTokenNewBalance = await testERC20.balanceOf(to);
      const feeTokenNewBalance = await testERC20.balanceOf(feeAddress);
      const contractTokenBalance = await testERC20.balanceOf(paymentFacet.address);

      // Check Native balance changes
      expect(toNativeNewBalance.toString()).to.equals(
        toNativeOldBalance.add(nativeConversionToPay.result.mul(2)).add('200').toString(),
      );
      expect(feeNativeNewBalance.toString()).to.equals(
        feeNativeOldBalance.add(nativeConversionFees.result.mul(2)).add('4').toString(),
      );
      expect(contractNativeBalance.toString()).to.equals('0');

      // Check Token balance changes
      expect(fromTokenNewBalance.toString()).to.equals(
        fromTokenOldBalance
          .sub(tokenConversionToPay.result.add(tokenConversionFees.result).mul(2))
          .sub('408')
          .toString(),
      );
      expect(toTokenNewBalance.toString()).to.equals(
        toTokenOldBalance.add(tokenConversionToPay.result.mul(2)).add('400').toString(),
      );
      expect(feeTokenNewBalance.toString()).to.equals(
        feeTokenOldBalance.add(tokenConversionFees.result.mul(2)).add('8').toString(),
      );
      expect(contractTokenBalance.toString()).to.equals('0');
    });
  });
});
