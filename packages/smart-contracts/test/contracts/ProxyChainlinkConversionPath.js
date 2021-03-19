const ethers = require('ethers');

const Utils = require('@requestnetwork/utils').default;
const { expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;

const { bigNumberify } = require('ethers/utils');

const TestERC20 = artifacts.require('./TestERC20.sol');
const ERC20FeeProxy = artifacts.require('./ERC20FeeProxy.sol');
const ChainlinkConversionPath = artifacts.require('./ChainlinkConversionPath.sol');
const Erc20ConversionProxy = artifacts.require('./Erc20ConversionProxy.sol');


contract('Erc20ConversionProxy', function (accounts) {
  const from = accounts[0];
  const to = accounts[1];
  const feeAddress = accounts[2];
  const amountInUSD = '5678000000'; // 56.78 with 8 decimal
  const smallAmountInFIAT = '100000000'; // 1 with 8 decimal
  const smallerAmountInFIAT = '10000000'; // 0.1 with 8 decimal
  const thousandWith18Decimal = '1000000000000000000001';
  const hundredWith18Decimal = '100000000000000000000';
  const referenceExample = '0xaaaa';

  const ETH_address = "0xF5AF88e117747e87fC5929F2ff87221B1447652E";
  const USD_address = "0x775EB53d00DD0Acd3EC1696472105d579B9b386b"; // Utils.crypto.last20bytesOfNormalizeKeccak256Hash({type: 'ISO4217', value: 'USD' });
  const EUR_address = "0x17B4158805772Ced11225E77339F90BeB5aAE968"; // Utils.crypto.last20bytesOfNormalizeKeccak256Hash({type: 'ISO4217', value: 'EUR' });
  const DAI_address = '0x38cF23C52Bb4B13F051Aec09580a2dE845a7FA35';

  let testErc20ConversionProxy;
  let testERC20;
  let erc20FeeProxy;
  let chainlinkConversionPath;

  beforeEach(async () => {
    testERC20 = await TestERC20.at('0x38cF23C52Bb4B13F051Aec09580a2dE845a7FA35');

    chainlinkConversionPath = await ChainlinkConversionPath.deployed();

    erc20FeeProxy = await ERC20FeeProxy.new({
      from,
    });

    testErc20ConversionProxy = await Erc20ConversionProxy.new(erc20FeeProxy.address, chainlinkConversionPath.address, {
      from,
    });

  });

  describe('transferFromWithReferenceAndFee', () => {
    describe('transferFromWithReferenceAndFee with DAI', () => {
      it('allows to transfer DAI tokens for USD payment', async function () {
        const path = [USD_address, DAI_address];
        await testERC20.approve(testErc20ConversionProxy.address, thousandWith18Decimal, { from });

        const fromOldBalance = await testERC20.balanceOf(from);
        const toOldBalance = await testERC20.balanceOf(to);
        const feeOldBalance = await testERC20.balanceOf(feeAddress);
        const conversionToPay = await chainlinkConversionPath.getConversion(
          smallAmountInFIAT,
          path
        );
        const conversionFees = await chainlinkConversionPath.getConversion(
          smallerAmountInFIAT,
          path
        );
    
        const { logs } = await testErc20ConversionProxy.transferFromWithReferenceAndFee(
          to,
          smallAmountInFIAT,
          path,
          referenceExample,
          smallerAmountInFIAT,
          feeAddress,
          hundredWith18Decimal,
          0,
          { from },
        );
       
        expectEvent.inLogs(logs, 'TransferWithConversionAndReference', {
          amount: smallAmountInFIAT,
          currency: path[0],
          paymentReference: ethers.utils.keccak256(referenceExample),
          feeAmount: smallerAmountInFIAT,
          maxRateTimespan: "0",
        });
      
      
        const fromNewBalance = await testERC20.balanceOf(from);
        const toNewBalance = await testERC20.balanceOf(to);
        const feeNewBalance = await testERC20.balanceOf(feeAddress);
      
        const fromDiffBalance = bigNumberify(fromNewBalance.toString()).sub(fromOldBalance.toString()).toString();
        const toDiffBalance = bigNumberify(toNewBalance.toString()).sub(toOldBalance.toString()).toString();
        const feeDiffBalance = bigNumberify(feeNewBalance.toString()).sub(feeOldBalance.toString()).toString();
      
        // Check balance changes
        expect(fromDiffBalance.toString()).to.equals('-' + bigNumberify(conversionToPay.result.toString()).add(conversionFees.result.toString()));
        expect(toDiffBalance).to.equals(conversionToPay.result.toString());
        expect(feeDiffBalance).to.equals(conversionFees.result.toString());
      });
      it('allows to transfer DAI tokens for EUR payment', async function () {
        const path = [EUR_address, USD_address, DAI_address];
        await testERC20.approve(testErc20ConversionProxy.address, thousandWith18Decimal, { from });

        const fromOldBalance = await testERC20.balanceOf(from);
        const toOldBalance = await testERC20.balanceOf(to);
        const feeOldBalance = await testERC20.balanceOf(feeAddress);
        const conversionToPay = await chainlinkConversionPath.getConversion(
          smallAmountInFIAT,
          path
        );
        const conversionFees = await chainlinkConversionPath.getConversion(
          smallerAmountInFIAT,
          path
        );
    
        const { logs } = await testErc20ConversionProxy.transferFromWithReferenceAndFee(
          to,
          smallAmountInFIAT,
          path,
          referenceExample,
          smallerAmountInFIAT,
          feeAddress,
          hundredWith18Decimal,
          0,
          { from },
        );
       
        expectEvent.inLogs(logs, 'TransferWithConversionAndReference', {
          amount: smallAmountInFIAT,
          currency: path[0],
          paymentReference: ethers.utils.keccak256(referenceExample),
          feeAmount: smallerAmountInFIAT,
          maxRateTimespan: "0",
        });
      
      
        const fromNewBalance = await testERC20.balanceOf(from);
        const toNewBalance = await testERC20.balanceOf(to);
        const feeNewBalance = await testERC20.balanceOf(feeAddress);
      
        const fromDiffBalance = bigNumberify(fromNewBalance.toString()).sub(fromOldBalance.toString()).toString();
        const toDiffBalance = bigNumberify(toNewBalance.toString()).sub(toOldBalance.toString()).toString();
        const feeDiffBalance = bigNumberify(feeNewBalance.toString()).sub(feeOldBalance.toString()).toString();
      
        // Check balance changes
        expect(fromDiffBalance.toString()).to.equals('-' + bigNumberify(conversionToPay.result.toString()).add(conversionFees.result.toString()));
        expect(toDiffBalance).to.equals(conversionToPay.result.toString());
        expect(feeDiffBalance).to.equals(conversionFees.result.toString());
      });
    });

    describe('transferFromWithReferenceAndFee with errors', () => {
      it('cannot transfer with invalid path', async function () {
        const path = [EUR_address, ETH_address, DAI_address];  
        await testERC20.approve(testErc20ConversionProxy.address, thousandWith18Decimal, { from });

        await expect(testErc20ConversionProxy.transferFromWithReferenceAndFee(
          to,
          smallAmountInFIAT,
          path,
          referenceExample,
          smallerAmountInFIAT,
          feeAddress,
          hundredWith18Decimal,
          0,
          { from },
        )).to.eventually.rejectedWith();
      });
      it('cannot transfer if max to spend too low', async function () {
        const path = [USD_address, DAI_address];  
        await testERC20.approve(testErc20ConversionProxy.address, thousandWith18Decimal, { from });

        await expect(testErc20ConversionProxy.transferFromWithReferenceAndFee(
          to,
          smallAmountInFIAT,
          path,
          referenceExample,
          smallerAmountInFIAT,
          feeAddress,
          100,
          0,
          { from },
        )).to.eventually.rejectedWith();
      });
      it('cannot transfer if rate is too old', async function () {
        const path = [USD_address, DAI_address];  
        await testERC20.approve(testErc20ConversionProxy.address, thousandWith18Decimal, { from });

        await expect(testErc20ConversionProxy.transferFromWithReferenceAndFee(
          to,
          smallAmountInFIAT,
          path,
          referenceExample,
          smallerAmountInFIAT,
          feeAddress,
          hundredWith18Decimal,
          10, // ten secondes
          { from },
        )).to.eventually.rejectedWith();
      });
    });
  });
});
