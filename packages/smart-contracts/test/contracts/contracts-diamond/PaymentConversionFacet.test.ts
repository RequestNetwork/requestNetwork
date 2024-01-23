import { ethers, network } from 'hardhat';
import {
  AggregatorMock__factory,
  DiamondChainlinkConversionFacet,
  DiamondChainlinkConversionFacet__factory,
  DiamondPaymentConversionFacet,
  DiamondPaymentConversionFacet__factory,
  ERC20,
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

describe('Contract: PaymentConversionFacet', () => {
  let diamondAddress: string;
  let from: string;
  let to: string;
  let feeAddress: string;
  let signer: Signer;
  let toSigner: Signer;
  let erc20Adresses: ERC20Addresses;
  const amountInFiat = '100000000'; // 1 with 8 decimal
  const feesAmountInFiat = '10000000'; // 0.1 with 8 decimal
  const thousandWith18Decimal = '1000000000000000000000';
  const hundredWith18Decimal = '100000000000000000000';
  const referenceExample = '0xaaaa';

  const currencyManager = CurrencyManager.getDefault();

  const ETH_hash = currencyManager.fromSymbol('ETH-private')!.hash;
  const USD_hash = currencyManager.fromSymbol('USD')!.hash;
  const EUR_hash = currencyManager.fromSymbol('EUR')!.hash;
  let DAI_address: string;

  let testERC20: ERC20;
  let chainlinkFacet: DiamondChainlinkConversionFacet;
  let paymentConversionFacet: DiamondPaymentConversionFacet;
  let gnosisSafeProxy: GnosisSafeProxy;
  let etherPaymentFallback: EtherPaymentFallback;
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

    DAI_address = erc20Adresses.ERC20TestAddress;

    // Gnosis Safe specific deployments
    etherPaymentFallback = await new EtherPaymentFallback__factory(signer).deploy();
    gnosisSafeProxy = await new GnosisSafeProxy__factory(signer).deploy(
      etherPaymentFallback.address,
    );
  });

  describe('Token Transfer With Conversion', () => {
    // Before each test make an approval
    beforeEach(async () => {
      testERC20 = ERC20__factory.connect(DAI_address, signer);
      await testERC20.approve(paymentConversionFacet.address, thousandWith18Decimal);
    });

    // After each test send all funds from "to" to "from"
    afterEach(async () => {
      testERC20 = testERC20.connect(toSigner);
      const toFinalBalance = await testERC20.balanceOf(to);
      await testERC20.transfer(from, toFinalBalance);
      testERC20 = testERC20.connect(signer);
    });

    describe('TokenTransferWithConversion - Happy Path', () => {
      it('allows to transfer DAI tokens for USD payment', async function () {
        const path = [USD_hash, DAI_address];

        const fromOldBalance = await testERC20.balanceOf(from);
        const toOldBalance = await testERC20.balanceOf(to);
        const feeOldBalance = await testERC20.balanceOf(feeAddress);
        const conversionToPay = await chainlinkFacet.getConversion(amountInFiat, path);
        const conversionFees = await chainlinkFacet.getConversion(feesAmountInFiat, path);

        await expect(
          paymentConversionFacet.tokenTransferWithConversion(
            to,
            amountInFiat,
            path,
            referenceExample,
            feesAmountInFiat,
            feeAddress,
            hundredWith18Decimal,
            0,
          ),
        )
          .to.emit(paymentConversionFacet, 'TransferWithConversion')
          .withArgs(
            amountInFiat,
            ethers.utils.getAddress(path[0]),
            ethers.utils.keccak256(referenceExample),
            feesAmountInFiat,
            '0',
          )
          .to.emit(paymentConversionFacet, 'TokenTransferWithConversion')
          .withArgs(
            ethers.utils.getAddress(DAI_address),
            ethers.utils.getAddress(to),
            conversionToPay.result,
            ethers.utils.keccak256(referenceExample),
            conversionFees.result,
            feeAddress,
          );

        const fromNewBalance = await testERC20.balanceOf(from);
        const toNewBalance = await testERC20.balanceOf(to);
        const feeNewBalance = await testERC20.balanceOf(feeAddress);

        const fromDiffBalance = BigNumber.from(fromNewBalance.toString())
          .sub(fromOldBalance.toString())
          .toString();
        const toDiffBalance = BigNumber.from(toNewBalance.toString())
          .sub(toOldBalance.toString())
          .toString();
        const feeDiffBalance = BigNumber.from(feeNewBalance.toString())
          .sub(feeOldBalance.toString())
          .toString();

        // Check balance changes
        expect(fromDiffBalance.toString()).to.equals(
          '-' +
            BigNumber.from(conversionToPay.result.toString()).add(conversionFees.result.toString()),
        );
        expect(toDiffBalance).to.equals(conversionToPay.result.toString());
        expect(feeDiffBalance).to.equals(conversionFees.result.toString());
      });

      it('allows to transfer DAI tokens for EUR payment', async function () {
        const path = [EUR_hash, USD_hash, DAI_address];
        await testERC20.approve(paymentConversionFacet.address, thousandWith18Decimal, { from });

        const fromOldBalance = await testERC20.balanceOf(from);
        const toOldBalance = await testERC20.balanceOf(to);
        const feeOldBalance = await testERC20.balanceOf(feeAddress);
        const conversionToPay = await chainlinkFacet.getConversion(amountInFiat, path);
        const conversionFees = await chainlinkFacet.getConversion(feesAmountInFiat, path);

        await expect(
          paymentConversionFacet.tokenTransferWithConversion(
            to,
            amountInFiat,
            path,
            referenceExample,
            feesAmountInFiat,
            feeAddress,
            hundredWith18Decimal,
            0,
          ),
        )
          .to.emit(testERC20, 'Transfer')
          .to.emit(paymentConversionFacet, 'TransferWithConversion')
          .withArgs(
            amountInFiat,
            ethers.utils.getAddress(path[0]),
            ethers.utils.keccak256(referenceExample),
            feesAmountInFiat,
            '0',
          )
          .to.emit(paymentConversionFacet, 'TokenTransferWithConversion')
          .withArgs(
            ethers.utils.getAddress(DAI_address),
            ethers.utils.getAddress(to),
            conversionToPay.result,
            ethers.utils.keccak256(referenceExample),
            conversionFees.result,
            feeAddress,
          );

        const fromNewBalance = await testERC20.balanceOf(from);
        const toNewBalance = await testERC20.balanceOf(to);
        const feeNewBalance = await testERC20.balanceOf(feeAddress);

        const fromDiffBalance = fromNewBalance.sub(fromOldBalance);
        const toDiffBalance = toNewBalance.sub(toOldBalance);
        const feeDiffBalance = feeNewBalance.sub(feeOldBalance);

        // Check balance changes
        expect(fromDiffBalance.toString()).to.equals(
          '-' + conversionToPay.result.add(conversionFees.result).toString(),
        );
        expect(toDiffBalance.toString()).to.equals(conversionToPay.result.toString());
        expect(feeDiffBalance.toString()).to.equals(conversionFees.result.toString());
      });
    });

    describe('TokenTransferWithConversion - With Errors', () => {
      it('cannot transfer with invalid path', async function () {
        const path = [EUR_hash, ETH_hash, DAI_address];

        await expect(
          paymentConversionFacet.tokenTransferWithConversion(
            to,
            amountInFiat,
            path,
            referenceExample,
            feesAmountInFiat,
            feeAddress,
            hundredWith18Decimal,
            0,
            {
              from,
            },
          ),
        ).to.be.revertedWith('Could not get conversion rate');
      });

      it('cannot transfer if max to spend too low', async function () {
        const path = [USD_hash, DAI_address];
        await testERC20.approve(paymentConversionFacet.address, thousandWith18Decimal, {
          from,
        });

        await expect(
          paymentConversionFacet.tokenTransferWithConversion(
            to,
            amountInFiat,
            path,
            referenceExample,
            feesAmountInFiat,
            feeAddress,
            100,
            0,
            {
              from,
            },
          ),
        ).to.be.revertedWith('Amount to pay is over the user limit');
      });

      it('cannot transfer if rate is too old', async function () {
        const path = [USD_hash, DAI_address];
        await testERC20.approve(paymentConversionFacet.address, thousandWith18Decimal, {
          from,
        });

        await expect(
          paymentConversionFacet.tokenTransferWithConversion(
            to,
            amountInFiat,
            path,
            referenceExample,
            feesAmountInFiat,
            feeAddress,
            hundredWith18Decimal,
            10, // ten secondes
            {
              from,
            },
          ),
        ).to.be.revertedWith('aggregator rate is outdated');
      });
    });
  });

  describe('Native Transfer With Conversion', () => {
    describe('NativeTransferWithConversion - Happy Path', () => {
      it('allows to transfer ETH for USD payment', async function () {
        const path = [USD_hash, ETH_hash];

        const fromOldBalance = await provider.getBalance(from);
        const toOldBalance = await provider.getBalance(to);
        const feeOldBalance = await provider.getBalance(feeAddress);
        const conversionToPay = await chainlinkFacet.getConversion(amountInFiat, path);
        const conversionFees = await chainlinkFacet.getConversion(feesAmountInFiat, path);

        const tx = paymentConversionFacet.nativeTransferWithConversion(
          to,
          amountInFiat,
          path,
          referenceExample,
          feesAmountInFiat,
          feeAddress,
          0,
          {
            value: conversionFees.result.add(conversionToPay.result),
          },
        );

        await expect(tx)
          .to.emit(paymentConversionFacet, 'TransferWithConversion')
          .withArgs(
            amountInFiat,
            ethers.utils.getAddress(path[0]),
            ethers.utils.keccak256(referenceExample),
            feesAmountInFiat,
            '0',
          )
          .to.emit(paymentConversionFacet, 'NativeTransferWithConversion')
          .withArgs(
            to,
            conversionToPay.result,
            ethers.utils.keccak256(referenceExample),
            conversionFees.result,
            feeAddress,
          );

        const fromNewBalance = await provider.getBalance(from);
        const toNewBalance = await provider.getBalance(to);
        const feeNewBalance = await provider.getBalance(feeAddress);
        const contractBalance = await provider.getBalance(paymentConversionFacet.address);

        const toDiffBalance = BigNumber.from(toNewBalance).sub(toOldBalance).toString();
        const feeDiffBalance = BigNumber.from(feeNewBalance).sub(feeOldBalance).toString();

        // Check balance changes
        expect(fromNewBalance).to.be.lt(
          fromOldBalance.sub(conversionToPay.result).sub(conversionFees.result),
        );
        expect(fromNewBalance).to.be.gt(
          fromOldBalance.sub(conversionToPay.result).sub(conversionFees.result).mul(95).div(100),
        );
        expect(toDiffBalance).to.equals(conversionToPay.result.toString());
        expect(feeDiffBalance).to.equals(conversionFees.result.toString());
        expect(contractBalance.toString()).to.equals('0');
      });

      it('allows to transfer ETH for EUR payment and extra msg.value', async function () {
        const path = [EUR_hash, USD_hash, ETH_hash];

        const fromOldBalance = await provider.getBalance(from);
        const toOldBalance = await provider.getBalance(to);
        const feeOldBalance = await provider.getBalance(feeAddress);
        const conversionToPay = await chainlinkFacet.getConversion(amountInFiat, path);
        const conversionFees = await chainlinkFacet.getConversion(feesAmountInFiat, path);

        const tx = paymentConversionFacet.nativeTransferWithConversion(
          to,
          amountInFiat,
          path,
          referenceExample,
          feesAmountInFiat,
          feeAddress,
          0,
          {
            value: conversionFees.result.add(conversionToPay.result).add('100000'),
          },
        );

        await expect(tx)
          .to.emit(paymentConversionFacet, 'TransferWithConversion')
          .withArgs(
            amountInFiat,
            ethers.utils.getAddress(path[0]),
            ethers.utils.keccak256(referenceExample),
            feesAmountInFiat,
            '0',
          )
          .to.emit(paymentConversionFacet, 'NativeTransferWithConversion')
          .withArgs(
            to,
            conversionToPay.result,
            ethers.utils.keccak256(referenceExample),
            conversionFees.result,
            feeAddress,
          );

        const fromNewBalance = await provider.getBalance(from);
        const toNewBalance = await provider.getBalance(to);
        const feeNewBalance = await provider.getBalance(feeAddress);
        const contractBalance = await provider.getBalance(paymentConversionFacet.address);

        const toDiffBalance = BigNumber.from(toNewBalance).sub(toOldBalance).toString();
        const feeDiffBalance = BigNumber.from(feeNewBalance).sub(feeOldBalance).toString();

        expect(contractBalance.toString()).to.equals('0');

        // Check balance changes
        expect(fromNewBalance).to.be.lt(
          fromOldBalance.sub(conversionToPay.result).sub(conversionFees.result),
        );
        expect(fromNewBalance).to.be.gt(
          fromOldBalance.sub(conversionToPay.result).sub(conversionFees.result).mul(95).div(100),
        );
        expect(toDiffBalance).to.equals(conversionToPay.result.toString());
        expect(feeDiffBalance).to.equals(conversionFees.result.toString());
      });

      it('allows to transfer ETH for EUR payment and extra msg.value to a gnosis safe', async function () {
        const path = [EUR_hash, USD_hash, ETH_hash];

        const fromOldBalance = await provider.getBalance(from);
        const gnosisSafeOldBalance = await provider.getBalance(gnosisSafeProxy.address);
        const feeOldBalance = await provider.getBalance(feeAddress);
        const conversionToPay = await chainlinkFacet.getConversion(amountInFiat, path);
        const conversionFees = await chainlinkFacet.getConversion(feesAmountInFiat, path);

        const tx = paymentConversionFacet.nativeTransferWithConversion(
          gnosisSafeProxy.address,
          amountInFiat,
          path,
          referenceExample,
          feesAmountInFiat,
          feeAddress,
          0,
          {
            value: conversionFees.result.add(conversionToPay.result).add('100000'),
          },
        );

        await expect(tx)
          .to.emit(paymentConversionFacet, 'TransferWithConversion')
          .withArgs(
            amountInFiat,
            ethers.utils.getAddress(path[0]),
            ethers.utils.keccak256(referenceExample),
            feesAmountInFiat,
            '0',
          )
          .to.emit(paymentConversionFacet, 'NativeTransferWithConversion')
          .withArgs(
            gnosisSafeProxy.address,
            conversionToPay.result,
            ethers.utils.keccak256(referenceExample),
            conversionFees.result,
            feeAddress,
          );

        const fromNewBalance = await provider.getBalance(from);
        const gnosisSafeNewBalance = await provider.getBalance(gnosisSafeProxy.address);
        const feeNewBalance = await provider.getBalance(feeAddress);
        const contractBalance = await provider.getBalance(paymentConversionFacet.address);

        const toDiffBalance = BigNumber.from(gnosisSafeNewBalance)
          .sub(gnosisSafeOldBalance)
          .toString();
        const feeDiffBalance = BigNumber.from(feeNewBalance).sub(feeOldBalance).toString();

        expect(contractBalance.toString()).to.equals('0');

        // Check balance changes
        expect(fromNewBalance).to.be.lt(
          fromOldBalance.sub(conversionToPay.result).sub(conversionFees.result),
        );
        expect(fromNewBalance).to.be.gt(
          fromOldBalance.sub(conversionToPay.result).sub(conversionFees.result).mul(95).div(100),
        );
        expect(toDiffBalance).to.equals(conversionToPay.result.toString());
        expect(feeDiffBalance).to.equals(conversionFees.result.toString());
      });
    });

    describe('NativeTransferWithConversion - With Errors', () => {
      it('cannot transfer if msg.value too low for amount', async function () {
        const path = [USD_hash, ETH_hash];

        const mainEthAmount = await chainlinkFacet.getConversion(amountInFiat, path);

        await expect(
          paymentConversionFacet.nativeTransferWithConversion(
            to,
            amountInFiat,
            path,
            referenceExample,
            feesAmountInFiat,
            feeAddress,
            0,
            {
              value: mainEthAmount.result, // Fees amount missing
            },
          ),
        ).to.be.revertedWith('nativeTransferWithConversion failed: tx.value too low');
      });

      it('cannot transfer if msg.value too low for fee', async function () {
        const path = [USD_hash, ETH_hash];

        const mainEthAmount = await chainlinkFacet.getConversion(amountInFiat, path);
        const ethFee = await chainlinkFacet.getConversion(feesAmountInFiat, path);

        await expect(
          paymentConversionFacet.nativeTransferWithConversion(
            to,
            amountInFiat,
            path,
            referenceExample,
            feesAmountInFiat,
            feeAddress,
            0,
            {
              value: mainEthAmount.result.add(ethFee.result).sub(1),
            },
          ),
        ).to.be.revertedWith('nativeTransferWithConversion failed: tx.value too low');
      });
      it('cannot transfer if rate is too old', async function () {
        const path = [USD_hash, ETH_hash];

        const mainEthAmount = await chainlinkFacet.getConversion(amountInFiat, path);
        const ethFee = await chainlinkFacet.getConversion(feesAmountInFiat, path);
        await expect(
          paymentConversionFacet.nativeTransferWithConversion(
            to,
            amountInFiat,
            path,
            referenceExample,
            feesAmountInFiat,
            feeAddress,
            1, // second
            {
              value: ethFee.result.add(mainEthAmount.result),
            },
          ),
        ).to.be.revertedWith('aggregator rate is outdated');
      });

      it('cannot transfer with another native token hash', async function () {
        const MATIC_HASH = currencyManager.fromSymbol('MATIC')!.hash;
        const path = [USD_hash, MATIC_HASH];

        await expect(
          paymentConversionFacet.nativeTransferWithConversion(
            to,
            amountInFiat,
            path,
            referenceExample,
            feesAmountInFiat,
            feeAddress,
            0,
            {
              value: '1000000000000000000000', // Any value
            },
          ),
        ).to.be.revertedWith('payment currency must be the native token');
      });
    });
  });
});
