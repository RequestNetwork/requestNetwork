import { ethers, network } from 'hardhat';
import {
  EthereumFeeProxy__factory,
  EthConversionProxy__factory,
  EthereumFeeProxy,
  ChainlinkConversionPath,
  EthConversionProxy,
  ChainlinkConversionPath__factory,
  AggregatorMock__factory,
  EtherPaymentFallback,
  GnosisSafeProxy,
  EtherPaymentFallback__factory,
  GnosisSafeProxy__factory,
} from '../../src/types';
import { BigNumber, Signer } from 'ethers';
import { expect, use } from 'chai';
import { solidity } from 'ethereum-waffle';
import { CurrencyManager } from '@requestnetwork/currency';
import { chainlinkConversionPath } from '../../src/lib';
import { HttpNetworkConfig } from 'hardhat/types';

use(solidity);

describe('contract: EthConversionProxy', () => {
  let from: string;
  let to: string;
  let feeAddress: string;
  let signer: Signer;
  const amountInFiat = BigNumber.from('100000000');
  const feesAmountInFiat = BigNumber.from('10000000');
  const referenceExample = '0xaaaa';

  const currencyManager = CurrencyManager.getDefault();

  const ETH_hash = currencyManager.fromSymbol('ETH')!.hash;
  const USD_hash = currencyManager.fromSymbol('USD')!.hash;
  const EUR_hash = currencyManager.fromSymbol('EUR')!.hash;

  let testEthConversionProxy: EthConversionProxy;
  let ethFeeProxy: EthereumFeeProxy;
  let chainlinkPath: ChainlinkConversionPath;
  let gnosisSafeProxy: GnosisSafeProxy;
  let etherPaymentFallback: EtherPaymentFallback;
  const networkConfig = network.config as HttpNetworkConfig;
  const provider = new ethers.providers.JsonRpcProvider(networkConfig.url);

  before(async () => {
    [from, to, feeAddress] = (await ethers.getSigners()).map((s) => s.address);
    [signer] = await ethers.getSigners();

    chainlinkPath = chainlinkConversionPath.connect(network.name, signer);
    ethFeeProxy = await new EthereumFeeProxy__factory(signer).deploy();
    testEthConversionProxy = await new EthConversionProxy__factory(signer).deploy(
      ethFeeProxy.address,
      chainlinkPath.address,
      ETH_hash,
      from,
    );
    etherPaymentFallback = await new EtherPaymentFallback__factory(signer).deploy();
    gnosisSafeProxy = await new GnosisSafeProxy__factory(signer).deploy(
      etherPaymentFallback.address,
    );
  });

  describe('transferWithReferenceAndFee', () => {
    describe('transferWithReferenceAndFee with ETH', () => {
      it('allows to transfer ETH for USD payment', async function () {
        const path = [USD_hash, ETH_hash];

        const fromOldBalance = await provider.getBalance(from);
        const toOldBalance = await provider.getBalance(to);
        const feeOldBalance = await provider.getBalance(feeAddress);
        const conversionToPay = await chainlinkPath.getConversion(amountInFiat, path);
        const conversionFees = await chainlinkPath.getConversion(feesAmountInFiat, path);

        const tx = testEthConversionProxy.transferWithReferenceAndFee(
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
          .to.emit(testEthConversionProxy, 'TransferWithConversionAndReference')
          .withArgs(
            amountInFiat,
            ethers.utils.getAddress(path[0]),
            ethers.utils.keccak256(referenceExample),
            feesAmountInFiat,
            '0',
          );

        const fromNewBalance = await provider.getBalance(from);
        const toNewBalance = await provider.getBalance(to);
        const feeNewBalance = await provider.getBalance(feeAddress);
        const contractBalance = await provider.getBalance(testEthConversionProxy.address);

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
        const conversionToPay = await chainlinkPath.getConversion(amountInFiat, path);
        const conversionFees = await chainlinkPath.getConversion(feesAmountInFiat, path);

        const tx = testEthConversionProxy.transferWithReferenceAndFee(
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
          .to.emit(testEthConversionProxy, 'TransferWithConversionAndReference')
          .withArgs(
            amountInFiat,
            ethers.utils.getAddress(path[0]),
            ethers.utils.keccak256(referenceExample),
            feesAmountInFiat,
            '0',
          );

        const fromNewBalance = await provider.getBalance(from);
        const toNewBalance = await provider.getBalance(to);
        const feeNewBalance = await provider.getBalance(feeAddress);
        const contractBalance = await provider.getBalance(testEthConversionProxy.address);
        const contractFeeBalance = await provider.getBalance(ethFeeProxy.address);

        const toDiffBalance = BigNumber.from(toNewBalance).sub(toOldBalance).toString();
        const feeDiffBalance = BigNumber.from(feeNewBalance).sub(feeOldBalance).toString();

        expect(contractBalance.toString()).to.equals('0');
        expect(contractFeeBalance.toString()).to.equals('0');

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
        const conversionToPay = await chainlinkPath.getConversion(amountInFiat, path);
        const conversionFees = await chainlinkPath.getConversion(feesAmountInFiat, path);

        const tx = testEthConversionProxy.transferWithReferenceAndFee(
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
          .to.emit(testEthConversionProxy, 'TransferWithConversionAndReference')
          .withArgs(
            amountInFiat,
            ethers.utils.getAddress(path[0]),
            ethers.utils.keccak256(referenceExample),
            feesAmountInFiat,
            '0',
          );

        const fromNewBalance = await provider.getBalance(from);
        const gnosisSafeNewBalance = await provider.getBalance(gnosisSafeProxy.address);
        const feeNewBalance = await provider.getBalance(feeAddress);
        const contractBalance = await provider.getBalance(testEthConversionProxy.address);
        const contractFeeBalance = await provider.getBalance(ethFeeProxy.address);

        const toDiffBalance = BigNumber.from(gnosisSafeNewBalance)
          .sub(gnosisSafeOldBalance)
          .toString();
        const feeDiffBalance = BigNumber.from(feeNewBalance).sub(feeOldBalance).toString();

        expect(contractBalance.toString()).to.equals('0');
        expect(contractFeeBalance.toString()).to.equals('0');

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

    describe('transferWithReferenceAndFee with errors', () => {
      it('cannot transfer if msg.value too low for amount', async function () {
        const path = [USD_hash, ETH_hash];

        const mainEthAmount = await chainlinkPath.getConversion(amountInFiat, path);

        await expect(
          testEthConversionProxy.transferWithReferenceAndFee(
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
        ).to.be.revertedWith('paymentProxy transferExactEthWithReferenceAndFee failed');
      });

      it('cannot transfer if msg.value too low for fee', async function () {
        const path = [USD_hash, ETH_hash];

        const mainEthAmount = await chainlinkPath.getConversion(amountInFiat, path);
        const ethFee = await chainlinkPath.getConversion(feesAmountInFiat, path);

        await expect(
          testEthConversionProxy.transferWithReferenceAndFee(
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
        ).to.be.revertedWith('paymentProxy transferExactEthWithReferenceAndFee failed');
      });
      it('cannot transfer if rate is too old', async function () {
        const path = [USD_hash, ETH_hash];

        const mainEthAmount = await chainlinkPath.getConversion(amountInFiat, path);
        const ethFee = await chainlinkPath.getConversion(feesAmountInFiat, path);
        await expect(
          testEthConversionProxy.transferWithReferenceAndFee(
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
        const USD_ETH_aggregator = await new AggregatorMock__factory(signer).deploy(
          50000000000,
          8,
          60,
        );
        const MATIC_HASH = currencyManager.fromSymbol('MATIC')!.hash;
        const maticChainlinkPath = await new ChainlinkConversionPath__factory(signer).deploy(
          MATIC_HASH,
          from,
        );
        const maticEthConversionProxy = await new EthConversionProxy__factory(signer).deploy(
          ethFeeProxy.address,
          maticChainlinkPath.address,
          MATIC_HASH,
          from,
        );
        await maticChainlinkPath.updateAggregator(ETH_hash, USD_hash, USD_ETH_aggregator.address);
        const path = [USD_hash, ETH_hash];

        const mainEthAmount = await chainlinkPath.getConversion(amountInFiat, path);
        const ethFee = await chainlinkPath.getConversion(feesAmountInFiat, path);
        await expect(
          maticEthConversionProxy.transferWithReferenceAndFee(
            to,
            amountInFiat,
            path,
            referenceExample,
            feesAmountInFiat,
            feeAddress,
            0,
            {
              value: ethFee.result.add(mainEthAmount.result),
            },
          ),
        ).to.be.revertedWith('payment currency must be the native token');
      });
    });
  });
});
