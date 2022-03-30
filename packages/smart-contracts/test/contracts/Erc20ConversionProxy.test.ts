import { ethers, network } from 'hardhat';
import {
  ERC20FeeProxy__factory,
  Erc20ConversionProxy__factory,
  ERC20FeeProxy,
  ChainlinkConversionPath,
  TestERC20,
  Erc20ConversionProxy,
  TestERC20__factory,
} from '../../src/types';
import { BigNumber, Signer } from 'ethers';
import { expect, use } from 'chai';
import { solidity } from 'ethereum-waffle';
import { CurrencyManager } from '@requestnetwork/currency';
import { chainlinkConversionPath } from '../../src/lib';
import { localERC20AlphaArtifact } from './localArtifacts';

use(solidity);

describe('contract: Erc20ConversionProxy', () => {
  let from: string;
  let to: string;
  let feeAddress: string;
  let signer: Signer;
  const amountInFiat = '100000000'; // 1 with 8 decimal
  const feesAmountInFiat = '10000000'; // 0.1 with 8 decimal
  const thousandWith18Decimal = '1000000000000000000000';
  const hundredWith18Decimal = '100000000000000000000';
  const referenceExample = '0xaaaa';

  const currencyManager = CurrencyManager.getDefault();

  const ETH_hash = currencyManager.fromSymbol('ETH')!.hash;
  const USD_hash = currencyManager.fromSymbol('USD')!.hash;
  const EUR_hash = currencyManager.fromSymbol('EUR')!.hash;
  let DAI_address: string;

  let testErc20ConversionProxy: Erc20ConversionProxy;
  let testERC20: TestERC20;
  let erc20FeeProxy: ERC20FeeProxy;
  let chainlinkPath: ChainlinkConversionPath;

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
    DAI_address = await localERC20AlphaArtifact.getAddress(network.name);
    testERC20 = await new TestERC20__factory(signer).attach(DAI_address);
    await testERC20.approve(erc20FeeProxy.address, '100');
  });

  describe('transferFromWithReferenceAndFee', () => {
    describe('transferFromWithReferenceAndFee with DAI', () => {
      it('allows to transfer DAI tokens for USD payment', async function () {
        const path = [USD_hash, DAI_address];
        await testERC20.approve(testErc20ConversionProxy.address, thousandWith18Decimal, {
          from,
        });

        const fromOldBalance = await testERC20.balanceOf(from);
        const toOldBalance = await testERC20.balanceOf(to);
        const feeOldBalance = await testERC20.balanceOf(feeAddress);
        const conversionToPay = await chainlinkPath.getConversion(amountInFiat, path);
        const conversionFees = await chainlinkPath.getConversion(feesAmountInFiat, path);

        await expect(
          testErc20ConversionProxy.transferFromWithReferenceAndFee(
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
            BigNumber.from(conversionToPay.result.toString()).add(conversionFees.result.toString()),
        );
        expect(toDiffBalance).to.equals(conversionToPay.result.toString());
        expect(feeDiffBalance).to.equals(conversionFees.result.toString());
      });

      it('allows to transfer DAI tokens for EUR payment', async function () {
        const path = [EUR_hash, USD_hash, DAI_address];
        await testERC20.approve(testErc20ConversionProxy.address, thousandWith18Decimal, { from });

        const fromOldBalance = await testERC20.balanceOf(from);
        const toOldBalance = await testERC20.balanceOf(to);
        const feeOldBalance = await testERC20.balanceOf(feeAddress);
        const conversionToPay = await chainlinkPath.getConversion(amountInFiat, path);
        const conversionFees = await chainlinkPath.getConversion(feesAmountInFiat, path);

        await expect(
          testErc20ConversionProxy.transferFromWithReferenceAndFee(
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
          '-' + conversionToPay.result.add(conversionFees.result).toString(),
        );
        expect(toDiffBalance.toString()).to.equals(conversionToPay.result.toString());
        expect(feeDiffBalance.toString()).to.equals(conversionFees.result.toString());
      });
    });

    describe('transferFromWithReferenceAndFee with errors', () => {
      it('cannot transfer with invalid path', async function () {
        const path = [EUR_hash, ETH_hash, DAI_address];
        await testERC20.approve(testErc20ConversionProxy.address, thousandWith18Decimal, {
          from,
        });

        await expect(
          testErc20ConversionProxy.transferFromWithReferenceAndFee(
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
        ).to.be.revertedWith('No aggregator found');
      });

      it('cannot transfer if max to spend too low', async function () {
        const path = [USD_hash, DAI_address];
        await testERC20.approve(testErc20ConversionProxy.address, thousandWith18Decimal, {
          from,
        });

        await expect(
          testErc20ConversionProxy.transferFromWithReferenceAndFee(
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
        await testERC20.approve(testErc20ConversionProxy.address, thousandWith18Decimal, {
          from,
        });

        await expect(
          testErc20ConversionProxy.transferFromWithReferenceAndFee(
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
});
