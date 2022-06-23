import { ethers, network } from 'hardhat';
import {
  ERC20FeeProxy__factory,
  Erc20ConversionProxy__factory,
  ERC20FeeProxy,
  ChainlinkConversionPath,
  TestERC20,
  Erc20ConversionProxy,
  TestERC20__factory,
  BatchConversionPayments,
  BatchConversionPayments__factory,
} from '../../src/types';
import { BigNumber, Signer } from 'ethers';
import { expect, use } from 'chai';
import { solidity } from 'ethereum-waffle';
import { CurrencyManager } from '@requestnetwork/currency';
import { chainlinkConversionPath } from '../../src/lib';
import { localERC20AlphaArtifact } from './localArtifacts';
// import { deepCopy } from 'ethers/lib/utils';

use(solidity);

describe('contract: BatchErc20ConversionPayments', () => {
  let from: string;
  let to: string;
  let feeAddress: string;
  let signer: Signer;
  const batchFee = 10;
  const amountInFiat = '100000000'; // 1 with 8 decimal
  const feesAmountInFiat = '10000000'; // 0.1 with 8 decimal
  const thousandWith18Decimal = '1000000000000000000000';
  // const hundredWith18Decimal =  '100000000000000000000';
  const referenceExample = '0xaaaa';

  const currencyManager = CurrencyManager.getDefault();

  const ETH_hash = currencyManager.fromSymbol('ETH')!.hash;
  const USD_hash = currencyManager.fromSymbol('USD')!.hash;
  const EUR_hash = currencyManager.fromSymbol('EUR')!.hash;
  let DAI_address: string;

  let testErc20ConversionProxy: Erc20ConversionProxy;
  let testBatchConversionProxy: BatchConversionPayments;
  let testERC20: TestERC20;
  let erc20FeeProxy: ERC20FeeProxy;
  let chainlinkPath: ChainlinkConversionPath;
  // let requestInfo: BatchConversionPayments.RequestInfo;
  before(async () => {
    [from, to, feeAddress] = (await ethers.getSigners()).map((s) => s.address);
    [signer] = await ethers.getSigners();

    chainlinkPath = chainlinkConversionPath.connect(network.name, signer);
    erc20FeeProxy = await new ERC20FeeProxy__factory(signer).deploy();

    testErc20ConversionProxy = await new Erc20ConversionProxy__factory(signer).deploy(
      erc20FeeProxy.address,
      chainlinkPath.address,
      await signer.getAddress(),
    );
    console.log(testErc20ConversionProxy.address);
    testBatchConversionProxy = await new BatchConversionPayments__factory(signer).deploy(
      testErc20ConversionProxy.address,
      chainlinkPath.address,
      await signer.getAddress(),
    );

    await testBatchConversionProxy.setBatchConversionFee(batchFee);
    DAI_address = localERC20AlphaArtifact.getAddress(network.name);
    testERC20 = new TestERC20__factory(signer).attach(DAI_address);
  });

  describe('transferFromWithReferenceAndFee', () => {
    describe('transferFromWithReferenceAndFee with DAI', () => {
      it('allows to transfer DAI tokens for USD payment', async function () {
        const path = [USD_hash, DAI_address];

        await testERC20.approve(testBatchConversionProxy.address, thousandWith18Decimal, {
          from,
        });
        const fromOldBalance = await testERC20.balanceOf(from);
        const toOldBalance = await testERC20.balanceOf(to);
        const feeOldBalance = await testERC20.balanceOf(feeAddress);
        const conversionToPay = await chainlinkPath.getConversion(amountInFiat, path);
        const conversionFees = await chainlinkPath.getConversion(feesAmountInFiat, path);

        await expect(
          testBatchConversionProxy.batchERC20ConversionPaymentsMultiTokens(
            [
              {
                _recipient: to,
                _requestAmount: amountInFiat,
                _path: path,
                _paymentReference: referenceExample,
                _feeAmount: feesAmountInFiat,
                _maxToSpend: conversionToPay.result.add(conversionFees.result).toString(),
                _maxRateTimespan: 0,
              },
            ],
            feeAddress,
          ),
        )
          .to.emit(testErc20ConversionProxy, 'TransferWithConversionAndReference')
          .withArgs(
            amountInFiat,
            ethers.utils.getAddress(path[0]),
            ethers.utils.keccak256(referenceExample),
            feesAmountInFiat,
            '0',
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
            conversionToPay.result
              .add(conversionToPay.result.mul(batchFee).div(1000))
              .add(conversionFees.result)
              .toString(),
        );
        expect(toDiffBalance).to.equals(conversionToPay.result.toString());
        expect(feeDiffBalance).to.equals(
          conversionToPay.result.mul(batchFee).div(1000).add(conversionFees.result).toString(),
        );
      });

      it('allows to transfer DAI tokens for EUR payment', async function () {
        const path = [EUR_hash, USD_hash, DAI_address];
        await testERC20.approve(testBatchConversionProxy.address, thousandWith18Decimal, {
          from,
        });

        const fromOldBalance = await testERC20.balanceOf(from);
        const toOldBalance = await testERC20.balanceOf(to);
        const feeOldBalance = await testERC20.balanceOf(feeAddress);
        const conversionToPay = await chainlinkPath.getConversion(amountInFiat, path);
        const conversionFees = await chainlinkPath.getConversion(feesAmountInFiat, path);

        await expect(
          testBatchConversionProxy.batchERC20ConversionPaymentsMultiTokens(
            [
              {
                _recipient: to,
                _requestAmount: amountInFiat,
                _path: path,
                _paymentReference: referenceExample,
                _feeAmount: feesAmountInFiat,
                _maxToSpend: conversionToPay.result.add(conversionFees.result).toString(),
                _maxRateTimespan: 0,
              },
            ],
            feeAddress,
          ),
        )
          .to.emit(testERC20, 'Transfer')
          .to.emit(testErc20ConversionProxy, 'TransferWithConversionAndReference')
          .withArgs(
            amountInFiat,
            ethers.utils.getAddress(path[0]),
            ethers.utils.keccak256(referenceExample),
            feesAmountInFiat,
            '0',
          )
          .to.emit(testErc20ConversionProxy, 'TransferWithReferenceAndFee')
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
          '-' +
            conversionToPay.result
              .add(conversionToPay.result.mul(batchFee).div(1000).add(conversionFees.result))
              .toString(),
        );
        expect(toDiffBalance.toString()).to.equals(conversionToPay.result.toString());
        expect(feeDiffBalance.toString()).to.equals(
          conversionToPay.result.mul(batchFee).div(1000).add(conversionFees.result).toString(),
        );
      });

      it('allows to transfer 2 transactions DAI tokens for EUR payment', async function () {
        const path = [EUR_hash, USD_hash, DAI_address];
        await testERC20.approve(testBatchConversionProxy.address, thousandWith18Decimal, {
          from,
        });

        const fromOldBalance = await testERC20.balanceOf(from);
        const toOldBalance = await testERC20.balanceOf(to);
        const feeOldBalance = await testERC20.balanceOf(feeAddress);
        const batchContractOldBalance = await testERC20.balanceOf(testBatchConversionProxy.address);
        const conversionToPay1 = await chainlinkPath.getConversion(amountInFiat, path);
        const conversionFees1 = await chainlinkPath.getConversion(feesAmountInFiat, path);
        await chainlinkPath.getConversion(feesAmountInFiat, path);
        await chainlinkPath.getConversion(feesAmountInFiat, path);
        await chainlinkPath.getConversion(feesAmountInFiat, path);

        const coef = 2;
        const amountInFiat2 = BigNumber.from(amountInFiat).mul(coef);
        const feesAmountInFiat2 = BigNumber.from(feesAmountInFiat).mul(coef);

        const conversionToPay2 = await chainlinkPath.getConversion(amountInFiat2, path);
        const conversionFees2 = await chainlinkPath.getConversion(feesAmountInFiat2, path);

        const batchFeeToPay = conversionToPay1.result
          .add(conversionToPay2.result)
          .mul(batchFee)
          .div(1000);
        const errorAmount = BigNumber.from(
          conversionToPay2.result
            .sub(conversionToPay1.result.mul(coef))
            .add(conversionFees2.result.sub(conversionFees1.result.mul(coef))),
        );
        console.log('conversionToPay1', conversionToPay1.result.toString());
        console.log('conversionToPay2', conversionToPay2.result.toString());
        console.log('conversionFees1', conversionFees1.result.toString());
        console.log('conversionFees2', conversionFees2.result.toString());
        console.log('errorAmount', errorAmount.toString());

        await expect(
          testBatchConversionProxy.batchERC20ConversionPaymentsMultiTokens(
            [
              {
                _recipient: to,
                _requestAmount: amountInFiat,
                _path: path,
                _paymentReference: referenceExample,
                _feeAmount: feesAmountInFiat,
                _maxToSpend: conversionToPay1.result.add(conversionFees1.result).toString(),
                _maxRateTimespan: 0,
              },
              {
                _recipient: to,
                _requestAmount: amountInFiat2,
                _path: path,
                _paymentReference: referenceExample,
                _feeAmount: feesAmountInFiat2,
                _maxToSpend: conversionToPay2.result.add(conversionFees2.result).toString(),
                _maxRateTimespan: 0,
              },
            ],
            feeAddress,
          ),
        )
          .to.emit(testERC20, 'Transfer')
          .to.emit(testErc20ConversionProxy, 'TransferWithConversionAndReference')
          .withArgs(
            amountInFiat,
            ethers.utils.getAddress(path[0]),
            ethers.utils.keccak256(referenceExample),
            feesAmountInFiat,
            '0',
          )
          .to.emit(testErc20ConversionProxy, 'TransferWithConversionAndReference')
          .withArgs(
            amountInFiat2,
            ethers.utils.getAddress(path[0]),
            ethers.utils.keccak256(referenceExample),
            feesAmountInFiat2,
            '0',
          )
          .to.emit(testErc20ConversionProxy, 'TransferWithReferenceAndFee')
          .withArgs(
            ethers.utils.getAddress(DAI_address),
            ethers.utils.getAddress(to),
            conversionToPay1.result,
            ethers.utils.keccak256(referenceExample),
            conversionFees1.result,
            feeAddress,
          )
          .to.emit(testErc20ConversionProxy, 'TransferWithReferenceAndFee')
          .withArgs(
            ethers.utils.getAddress(DAI_address),
            ethers.utils.getAddress(to),
            conversionToPay2.result,
            ethers.utils.keccak256(referenceExample),
            conversionFees2.result,
            feeAddress,
          );
        const batchContractBalance = await testERC20.balanceOf(testBatchConversionProxy.address);
        console.log('batchContracOldtBalance', batchContractOldBalance.toString());
        console.log('batchContractBalance', batchContractBalance.toString());
        const fromNewBalance = await testERC20.balanceOf(from);
        const toNewBalance = await testERC20.balanceOf(to);
        const feeNewBalance = await testERC20.balanceOf(feeAddress);

        const fromDiffBalance = fromNewBalance.sub(fromOldBalance);
        const toDiffBalance = toNewBalance.sub(toOldBalance);
        const feeDiffBalance = feeNewBalance.sub(feeOldBalance);

        // Check balance changes
        expect(fromDiffBalance.toString()).to.equals(
          '-' +
            conversionToPay1.result
              .add(conversionToPay2.result)
              .add(conversionFees1.result)
              .add(conversionFees2.result)
              .add(errorAmount) // due conversion diff, depending of the call
              .add(batchFeeToPay)
              .toString(),
        );
        expect(toDiffBalance.toString()).to.equals(
          conversionToPay1.result.add(conversionToPay2.result).toString(),
        );
        expect(feeDiffBalance.toString()).to.equals(
          conversionFees1.result.add(conversionFees2.result).add(batchFeeToPay).toString(),
        );
      });
    });

    describe('transferFromWithReferenceAndFee with errors', () => {
      it('cannot transfer with invalid path', async function () {
        const wrongPath = [EUR_hash, ETH_hash, DAI_address];
        const path = [EUR_hash, USD_hash, DAI_address];
        const conversionToPay = await chainlinkPath.getConversion(amountInFiat, path);
        const conversionFees = await chainlinkPath.getConversion(feesAmountInFiat, path);

        await testERC20.approve(testErc20ConversionProxy.address, thousandWith18Decimal, {
          from,
        });
        await expect(
          testBatchConversionProxy.batchERC20ConversionPaymentsMultiTokens(
            [
              {
                _recipient: to,
                _requestAmount: amountInFiat,
                _path: wrongPath,
                _paymentReference: referenceExample,
                _feeAmount: feesAmountInFiat,
                _maxToSpend: conversionToPay.result.add(conversionFees.result).toString(),
                _maxRateTimespan: 0,
              },
            ],
            feeAddress,
          ),
        ).to.be.revertedWith('revert No aggregator found');
      });

      it('cannot transfer if max to spend too low', async function () {
        const path = [USD_hash, DAI_address];
        const conversionToPay = await chainlinkPath.getConversion(amountInFiat, path);
        const conversionFees = await chainlinkPath.getConversion(feesAmountInFiat, path);
        await testERC20.approve(testErc20ConversionProxy.address, thousandWith18Decimal, {
          from,
        });

        await expect(
          testBatchConversionProxy.batchERC20ConversionPaymentsMultiTokens(
            [
              {
                _recipient: to,
                _requestAmount: amountInFiat,
                _path: path,
                _paymentReference: referenceExample,
                _feeAmount: feesAmountInFiat,
                _maxToSpend: conversionToPay.result.add(conversionFees.result).sub(1).toString(),
                _maxRateTimespan: 0,
              },
            ],
            feeAddress,
          ),
        ).to.be.revertedWith('Amount to pay is over the user limit');
      });

      it('cannot transfer if rate is too old', async function () {
        const path = [USD_hash, DAI_address];
        const conversionToPay = await chainlinkPath.getConversion(amountInFiat, path);
        const conversionFees = await chainlinkPath.getConversion(feesAmountInFiat, path);
        await testERC20.approve(testErc20ConversionProxy.address, thousandWith18Decimal, {
          from,
        });

        await expect(
          testBatchConversionProxy.batchERC20ConversionPaymentsMultiTokens(
            [
              {
                _recipient: to,
                _requestAmount: amountInFiat,
                _path: path,
                _paymentReference: referenceExample,
                _feeAmount: feesAmountInFiat,
                _maxToSpend: conversionToPay.result.add(conversionFees.result).sub(1).toString(),
                _maxRateTimespan: 10, // ten secondes
              },
            ],
            feeAddress,
          ),
        ).to.be.revertedWith('aggregator rate is outdated');
      });
    });
  });
});
