const ethers = require('ethers');

const Utils = require('@requestnetwork/utils').default;
const { expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { bigNumberify } = require('ethers/utils');

const TestERC20 = artifacts.require('./TestERC20.sol');
const ERC20FeeProxy = artifacts.require('./ERC20FeeProxy.sol');
const ChainlinkConversionPath = artifacts.require('./ChainlinkConversionPath.sol');
const ProxyChainlinkConversionPath = artifacts.require('./ProxyChainlinkConversionPath.sol');


contract('ProxyChainlinkConversionPath', function (accounts) {
  const from = accounts[0];
  const to = accounts[1];
  const feeAddress = accounts[2];
  const amountInUSD = '5678000000'; // 56.78 with 8 decimal
  const smallAmountInFIAT = '100000000'; // 1 with 8 decimal
  const smallerAmountInFIAT = '10000000'; // 0.1 with 8 decimal
  const thousandWith18Decimal = '1000000000000000000001';
  const hundredWith18Decimal = '100000000000000000000';
  const referenceExample = '0xaaaa';

  const ETH_address = "0x0000000000000000000000000000000000000000";
  const USD_address = "0x775EB53d00DD0Acd3EC1696472105d579B9b386b"; // Utils.crypto.last20bytesOfNormalizeKeccak256Hash({type: 'ISO4217', value: 'USD' });
  const EUR_address = "0x17B4158805772Ced11225E77339F90BeB5aAE968"; // Utils.crypto.last20bytesOfNormalizeKeccak256Hash({type: 'ISO4217', value: 'EUR' });
  const DAI_address = '0x38cF23C52Bb4B13F051Aec09580a2dE845a7FA35';

  let testProxyChainlinkConversionPath;
  let testERC20;
  let erc20FeeProxy;
  let chainlinkConversionPath;

  async function testTransferWithReference(path) {
    await testERC20.approve(testProxyChainlinkConversionPath.address, thousandWith18Decimal, { from });
  
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
      console.log(await testProxyChainlinkConversionPath.transferFromWithReferenceAndFee(
        to,
        smallAmountInFIAT,
        path,
        referenceExample,
        smallerAmountInFIAT,
        feeAddress,
        hundredWith18Decimal,
        { from },
      ));
    const { logs } = await testProxyChainlinkConversionPath.transferFromWithReferenceAndFee(
      to,
      smallAmountInFIAT,
      path,
      referenceExample,
      smallerAmountInFIAT,
      feeAddress,
      hundredWith18Decimal,
      { from },
    );
   
    expectEvent.inLogs(logs, 'TransferWithReferenceAndFee', {
      paymentCurrency: path[path.length-1],
      to,
      requestAmount: smallAmountInFIAT,
      requestCurrency: path[0],
      paymentReference: ethers.utils.keccak256(referenceExample),
      feesRequestAmount: smallerAmountInFIAT,
      feesTo: feeAddress
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
  }

  beforeEach(async () => {
    testERC20 = await TestERC20.at('0x38cF23C52Bb4B13F051Aec09580a2dE845a7FA35');

    chainlinkConversionPath = await ChainlinkConversionPath.deployed();

    erc20FeeProxy = await ERC20FeeProxy.new({
      from,
    });

    testProxyChainlinkConversionPath = await ProxyChainlinkConversionPath.new(erc20FeeProxy.address, chainlinkConversionPath.address, {
      from,
    });

  });

});
