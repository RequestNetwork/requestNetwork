import { ethers, network } from 'hardhat';
import {
  EthereumFeeProxy__factory,
  EthConversionProxy__factory,
  EthereumFeeProxy,
  ChainlinkConversionPath,
  EthConversionProxy,
} from '../../src/types';
import { BigNumber, Signer } from 'ethers';
import { expect, use } from 'chai';
import { solidity } from 'ethereum-waffle';
import { CurrencyManager } from '@requestnetwork/currency';
import { chainlinkConversionPath } from '../../src/lib';

use(solidity);

describe('contract: EthConversionProxy', () => {
  let from: string;
  let to: string;
  let feeAddress: string;
  let signer: Signer;
  const smallAmountInFIAT = BigNumber.from('100000000'); 
  const smallerAmountInFIAT = BigNumber.from('10000000');
  const referenceExample = '0xaaaa';

  const currencyManager = CurrencyManager.getDefault();

  const ETH_address = currencyManager.fromSymbol('ETH')!.hash;
  const USD_address = currencyManager.fromSymbol('USD')!.hash;
  const EUR_address = currencyManager.fromSymbol('EUR')!.hash;

  let testEthConversionProxy: EthConversionProxy;
  let ethFeeProxy: EthereumFeeProxy;
  let chainlinkPath: ChainlinkConversionPath;
  const provider = new ethers.providers.JsonRpcProvider();

  before(async () => {
    [from, to, feeAddress] = (await ethers.getSigners()).map((s) => s.address);
    [signer] = await ethers.getSigners();

    chainlinkPath = chainlinkConversionPath.connect(network.name, signer);
    ethFeeProxy = await new EthereumFeeProxy__factory(signer).deploy();
    testEthConversionProxy = await new EthConversionProxy__factory(signer).deploy(
      ethFeeProxy.address,
      chainlinkPath.address,
    );
  });

  describe('transferWithReferenceAndFee', () => {
    describe('transferWithReferenceAndFee with ETH', () => {
      it('allows to transfer ETH for USD payment', async function () {
        const path = [USD_address, ETH_address];

        const fromOldBalance = await provider.getBalance(from);
        const toOldBalance = await provider.getBalance(to);
        const feeOldBalance = await provider.getBalance(feeAddress);
        const conversionToPay = await chainlinkPath.getConversion(smallAmountInFIAT, path);
        const conversionFees = await chainlinkPath.getConversion(smallerAmountInFIAT, path);

        const tx = testEthConversionProxy.transferWithReferenceAndFee(
            to,
            smallAmountInFIAT,
            path,
            referenceExample,
            smallerAmountInFIAT,
            feeAddress,
            0,
            {
                value: conversionFees.result.add(conversionToPay.result),
            }
          )

        await expect(tx)
          .to.emit(testEthConversionProxy, 'TransferWithConversionAndReference')
          .withArgs(
            smallAmountInFIAT,
            ethers.utils.getAddress(path[0]),
            ethers.utils.keccak256(referenceExample),
            smallerAmountInFIAT,
            '0',
          );

        const receipt = await (await tx).wait();

        const fromNewBalance = await provider.getBalance(from);
        const toNewBalance = await provider.getBalance(to);
        const feeNewBalance = await provider.getBalance(feeAddress);
        const contractBalance = await provider.getBalance(testEthConversionProxy.address);

        const toDiffBalance = BigNumber.from(toNewBalance)
          .sub(toOldBalance)
          .toString();
        const feeDiffBalance = BigNumber.from(feeNewBalance)
          .sub(feeOldBalance)
          .toString();

        const gasPrice = (await provider.getFeeData()).gasPrice || 0;
        // Check balance changes
        expect(fromNewBalance.toString()).to.equals(
            fromOldBalance.sub(conversionToPay.result).sub(conversionFees.result).sub(receipt.gasUsed.mul(gasPrice)).toString(),
        );
        expect(toDiffBalance).to.equals(conversionToPay.result.toString());
        expect(feeDiffBalance).to.equals(conversionFees.result.toString());
        expect(contractBalance.toString()).to.equals("0")
      });

      it('allows to transfer ETH for EUR payment and extra msg.value', async function () {
        const path = [EUR_address, USD_address, ETH_address];

        const fromOldBalance = await provider.getBalance(from);
        const toOldBalance = await provider.getBalance(to);
        const feeOldBalance = await provider.getBalance(feeAddress);
        const conversionToPay = await chainlinkPath.getConversion(smallAmountInFIAT, path);
        const conversionFees = await chainlinkPath.getConversion(smallerAmountInFIAT, path);

        const tx = testEthConversionProxy.transferWithReferenceAndFee(
            to,
            smallAmountInFIAT,
            path,
            referenceExample,
            smallerAmountInFIAT,
            feeAddress,
            0,
            {
                value: conversionFees.result.add(conversionToPay.result)//.add("100000"),
            }
          )

        await expect(tx)
          .to.emit(testEthConversionProxy, 'TransferWithConversionAndReference')
          .withArgs(
            smallAmountInFIAT,
            ethers.utils.getAddress(path[0]),
            ethers.utils.keccak256(referenceExample),
            smallerAmountInFIAT,
            '0',
          );

        const receipt = await (await tx).wait();

        const fromNewBalance = await provider.getBalance(from);
        const toNewBalance = await provider.getBalance(to);
        const feeNewBalance = await provider.getBalance(feeAddress);
        const contractBalance = await provider.getBalance(testEthConversionProxy.address);
        const contractFeeBalance = await provider.getBalance(ethFeeProxy.address);

        const toDiffBalance = BigNumber.from(toNewBalance)
          .sub(toOldBalance)
          .toString();
        const feeDiffBalance = BigNumber.from(feeNewBalance)
          .sub(feeOldBalance)
          .toString();

        expect(contractBalance.toString()).to.equals("0");
        expect(contractFeeBalance.toString()).to.equals("0");

        const gasPrice = (await provider.getFeeData()).gasPrice || 0;
        // Check balance changes
        expect(fromNewBalance.toString()).to.equals(
            fromOldBalance.sub(conversionToPay.result).sub(conversionFees.result).sub(receipt.cumulativeGasUsed.mul(gasPrice)).toString(),
        );
        expect(toDiffBalance).to.equals(conversionToPay.result.toString());
        expect(feeDiffBalance).to.equals(conversionFees.result.toString());
      });
    });

    describe('transferWithReferenceAndFee with errors', () => {
      it('cannot transfer if msg.value too low', async function () {
        const path = [USD_address, ETH_address];

        const conversionToPay = await chainlinkPath.getConversion(smallAmountInFIAT, path);

        await expect(
            testEthConversionProxy.transferWithReferenceAndFee(
                to,
                smallAmountInFIAT,
                path,
                referenceExample,
                smallerAmountInFIAT,
                feeAddress,
                0,
                {
                    value: conversionToPay.result,
                }
              ),
        ).to.be.revertedWith('revert paymentProxy transferExactEthWithReferenceAndFee failed')
      });

      it('cannot transfer if rate is too old', async function () {
        const path = [USD_address, ETH_address];

        const conversionToPay = await chainlinkPath.getConversion(smallAmountInFIAT, path);
        const conversionFees = await chainlinkPath.getConversion(smallerAmountInFIAT, path);
        await expect(
            testEthConversionProxy.transferWithReferenceAndFee(
                to,
                smallAmountInFIAT,
                path,
                referenceExample,
                smallerAmountInFIAT,
                feeAddress,
                1, // second
                {
                    value: conversionFees.result.add(conversionToPay.result),
                }
              ),
        ).to.be.revertedWith('revert aggregator rate is outdated')
      });
    });
  });
});
