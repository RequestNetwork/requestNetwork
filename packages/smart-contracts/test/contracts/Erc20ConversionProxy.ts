import { ethers, network } from 'hardhat';
import {
  ERC20FeeProxy__factory,
  ChainlinkConversionPath__factory,
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
import { Currency } from '@requestnetwork/currency';
import { chainlinkConversionPath } from '../..';
import { localERC20AlphaArtifact } from './localArtifacts';

use(solidity);

describe('contract: Erc20ConversionProxy', () => {
  let from: string;
  let to: string;
  let feeAddress: string;
  let signer: Signer;
  const smallAmountInFIAT = '100000000'; // 1 with 8 decimal
  const smallerAmountInFIAT = '10000000'; // 0.1 with 8 decimal
  const thousandWith18Decimal = '1000000000000000000000';
  const hundredWith18Decimal = '100000000000000000000';
  const referenceExample = '0xaaaa';

  const ETH_address = Currency.fromSymbol('ETH').getHash();
  const USD_address = Currency.fromSymbol('USD').getHash();
  const EUR_address = Currency.fromSymbol('EUR').getHash();
  let DAI_address: string;

  let testErc20ConversionProxy: Erc20ConversionProxy;
  let testERC20: TestERC20;
  let erc20FeeProxy: ERC20FeeProxy;
  let chainlinkPath: ChainlinkConversionPath;

  before(async () => {
    [from, to, feeAddress] = (await ethers.getSigners()).map((s) => s.address);
    [signer] = await ethers.getSigners();

    const chainlinkPathFactory = await new ChainlinkConversionPath__factory(signer);
    chainlinkPath = await chainlinkPathFactory.attach(
      await chainlinkConversionPath.getAddress(network.name),
    );
    const proxyFactory = await new ERC20FeeProxy__factory(signer);
    erc20FeeProxy = await proxyFactory.deploy();
    const conversionProxyFactory = await new Erc20ConversionProxy__factory(signer);
    testErc20ConversionProxy = await conversionProxyFactory.deploy(
      erc20FeeProxy.address,
      chainlinkPath.address,
    );
    console.log('Proxy deployed, starting tests');
    // const erc20Factory = await ethers.getContractFactory('TestERC20');
    const erc20Factory = await new TestERC20__factory(signer);
    DAI_address = await localERC20AlphaArtifact.getAddress(network.name);
    testERC20 = await erc20Factory.attach(DAI_address);
    await testERC20.approve(erc20FeeProxy.address, '100');
  });

  // beforeEach(async () => {
  //   testERC20 = await TestERC20.at('0x38cF23C52Bb4B13F051Aec09580a2dE845a7FA35');
  // });

  describe('transferFromWithReferenceAndFee', () => {
    describe('transferFromWithReferenceAndFee with DAI', () => {
      it('allows to transfer DAI tokens for USD payment', async function () {
        const path = [USD_address, DAI_address];
        await testERC20.approve(testErc20ConversionProxy.address, thousandWith18Decimal, {
          from,
        });

        const fromOldBalance = await testERC20.balanceOf(from);
        const toOldBalance = await testERC20.balanceOf(to);
        const feeOldBalance = await testERC20.balanceOf(feeAddress);
        const conversionToPay = await chainlinkPath.getConversion(smallAmountInFIAT, path);
        const conversionFees = await chainlinkPath.getConversion(smallerAmountInFIAT, path);

        await expect(
          testErc20ConversionProxy.transferFromWithReferenceAndFee(
            to,
            smallAmountInFIAT,
            path,
            referenceExample,
            smallerAmountInFIAT,
            feeAddress,
            hundredWith18Decimal,
            0,
          ),
        )
          .to.emit(testErc20ConversionProxy, 'TransferWithConversionAndReference')
          .withArgs(
            smallAmountInFIAT,
            ethers.utils.getAddress(path[0]),
            ethers.utils.keccak256(referenceExample),
            smallerAmountInFIAT,
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
        const path = [EUR_address, USD_address, DAI_address];
        await testERC20.approve(testErc20ConversionProxy.address, thousandWith18Decimal, { from });

        const fromOldBalance = await testERC20.balanceOf(from);
        const toOldBalance = await testERC20.balanceOf(to);
        const feeOldBalance = await testERC20.balanceOf(feeAddress);
        const conversionToPay = await chainlinkPath.getConversion(smallAmountInFIAT, path);
        const conversionFees = await chainlinkPath.getConversion(smallerAmountInFIAT, path);

        await expect(
          testErc20ConversionProxy.transferFromWithReferenceAndFee(
            to,
            smallAmountInFIAT,
            path,
            referenceExample,
            smallerAmountInFIAT,
            feeAddress,
            hundredWith18Decimal,
            0,
          ),
        )
          .to.emit(testERC20, 'Transfer')
          .to.emit(testErc20ConversionProxy, 'TransferWithConversionAndReference')
          .withArgs(
            smallAmountInFIAT,
            ethers.utils.getAddress(path[0]),
            ethers.utils.keccak256(referenceExample),
            smallerAmountInFIAT,
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
        const path = [EUR_address, ETH_address, DAI_address];
        await testERC20.approve(testErc20ConversionProxy.address, thousandWith18Decimal, {
          from,
        });

        await expect(
          testErc20ConversionProxy.transferFromWithReferenceAndFee(
            to,
            smallAmountInFIAT,
            path,
            referenceExample,
            smallerAmountInFIAT,
            feeAddress,
            hundredWith18Decimal,
            0,
            { from },
          ),
        ).to.be.reverted;
      });

      it('cannot transfer if max to spend too low', async function () {
        const path = [USD_address, DAI_address];
        await testERC20.approve(testErc20ConversionProxy.address, thousandWith18Decimal, {
          from,
        });

        await expect(
          testErc20ConversionProxy.transferFromWithReferenceAndFee(
            to,
            smallAmountInFIAT,
            path,
            referenceExample,
            smallerAmountInFIAT,
            feeAddress,
            100,
            0,
            { from },
          ),
        ).to.be.reverted;
      });

      it('cannot transfer if rate is too old', async function () {
        const path = [USD_address, DAI_address];
        await testERC20.approve(testErc20ConversionProxy.address, thousandWith18Decimal, {
          from,
        });

        await expect(
          testErc20ConversionProxy.transferFromWithReferenceAndFee(
            to,
            smallAmountInFIAT,
            path,
            referenceExample,
            smallerAmountInFIAT,
            feeAddress,
            hundredWith18Decimal,
            10, // ten secondes
            { from },
          ),
        ).to.be.reverted;
      });
    });
  });
});
