import '@nomiclabs/hardhat-ethers';
import { BytesLike, Signer } from 'ethers';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  TestToken__factory,
  TestToken,
  ERC20SingleRequestProxy__factory,
  ERC20SingleRequestProxy,
  ERC20FeeProxy,
  ERC20FeeProxy__factory,
  UsdtFake,
  UsdtFake__factory,
} from '../../src/types';
import { BigNumber as BN } from 'ethers';

const BASE_DECIMAL = BN.from(10).pow(BN.from(18));
const USDT_DECIMAL = BN.from(10).pow(BN.from(6));

describe('contract: ERC20SingleRequestProxy', () => {
  let deployer: Signer;
  let user1: Signer, user1Addr: string;
  let user2: Signer, user2Addr: string;
  let feeRecipient: Signer, feeRecipientAddr: string;

  let testToken: TestToken;
  let erc20SingleRequestProxy: ERC20SingleRequestProxy;
  let erc20FeeProxy: ERC20FeeProxy;
  let usdtFake: UsdtFake;

  const paymentReference: BytesLike = '0xd0bc835c22f49e7e';
  const feeAmount: BN = BN.from(10).mul(BASE_DECIMAL);

  before(async function () {
    [deployer, user1, user2, feeRecipient] = await ethers.getSigners();
    user1Addr = await user1.getAddress();
    user2Addr = await user2.getAddress();
    feeRecipientAddr = await feeRecipient.getAddress();
  });

  beforeEach(async function () {
    const deployerAddr = await deployer.getAddress();
    testToken = await new TestToken__factory(deployer).deploy(deployerAddr);
    await testToken.mint(deployerAddr, BN.from(1000000).mul(BASE_DECIMAL));

    erc20FeeProxy = await new ERC20FeeProxy__factory(deployer).deploy();
    erc20SingleRequestProxy = await new ERC20SingleRequestProxy__factory(deployer).deploy(
      user2Addr,
      testToken.address,
      paymentReference,
      feeRecipientAddr,
      feeAmount,
      erc20FeeProxy.address,
    );

    await testToken.transfer(user1Addr, BN.from(10000).mul(BASE_DECIMAL));
    await testToken
      .connect(user1)
      .approve(erc20SingleRequestProxy.address, ethers.constants.MaxUint256);

    // Deploy UsdtFake
    usdtFake = await new UsdtFake__factory(deployer).deploy();
    await usdtFake.mint(deployerAddr, BN.from(1000000).mul(USDT_DECIMAL));
  });

  it('should be deployed', async () => {
    expect(erc20SingleRequestProxy.address).to.not.equal(ethers.constants.AddressZero);
  });

  it('should set the correct initial values', async () => {
    expect(await erc20SingleRequestProxy.payee()).to.equal(user2Addr);
    expect(await erc20SingleRequestProxy.tokenAddress()).to.equal(testToken.address);
    expect(await erc20SingleRequestProxy.feeAddress()).to.equal(feeRecipientAddr);
    expect(await erc20SingleRequestProxy.feeAmount()).to.equal(feeAmount);
    expect(await erc20SingleRequestProxy.paymentReference()).to.equal(paymentReference);
    expect(await erc20SingleRequestProxy.erc20FeeProxy()).to.equal(erc20FeeProxy.address);
  });

  it('should process a payment correctly via receive', async () => {
    const paymentAmount = BN.from(100).mul(BASE_DECIMAL);
    const totalAmount = paymentAmount.add(feeAmount);

    await testToken.connect(user1).transfer(erc20SingleRequestProxy.address, totalAmount);

    const erc20SingleRequestProxyBalanceBefore = await testToken.balanceOf(
      erc20SingleRequestProxy.address,
    );
    expect(erc20SingleRequestProxyBalanceBefore).to.equal(totalAmount);

    await expect(
      user1.sendTransaction({
        to: erc20SingleRequestProxy.address,
        value: 0,
      }),
    )
      .to.emit(erc20FeeProxy, 'TransferWithReferenceAndFee')
      .withArgs(
        testToken.address,
        user2Addr,
        paymentAmount,
        paymentReference,
        feeAmount,
        feeRecipientAddr,
      );

    const erc20SingleRequestProxyBalanceAfter = await testToken.balanceOf(
      erc20SingleRequestProxy.address,
    );
    const user2BalanceAfter = await testToken.balanceOf(user2Addr);
    const feeRecipientBalanceAfter = await testToken.balanceOf(feeRecipientAddr);

    expect(erc20SingleRequestProxyBalanceAfter).to.equal(0);
    expect(user2BalanceAfter).to.equal(paymentAmount);
    expect(feeRecipientBalanceAfter).to.equal(feeAmount);
  });

  it('should process a payment correctly via triggerERC20Payment', async () => {
    const paymentAmount = BN.from(100).mul(BASE_DECIMAL);
    const totalAmount = paymentAmount.add(feeAmount);

    await testToken.connect(user1).transfer(erc20SingleRequestProxy.address, totalAmount);

    const erc20SingleRequestProxyBalanceBefore = await testToken.balanceOf(
      erc20SingleRequestProxy.address,
    );
    expect(erc20SingleRequestProxyBalanceBefore).to.equal(totalAmount);

    await expect(erc20SingleRequestProxy.triggerERC20Payment())
      .to.emit(erc20FeeProxy, 'TransferWithReferenceAndFee')
      .withArgs(
        testToken.address,
        user2Addr,
        paymentAmount,
        paymentReference,
        feeAmount,
        feeRecipientAddr,
      );

    const erc20SingleRequestProxyBalanceAfter = await testToken.balanceOf(
      erc20SingleRequestProxy.address,
    );
    const user2BalanceAfter = await testToken.balanceOf(user2Addr);
    const feeRecipientBalanceAfter = await testToken.balanceOf(feeRecipientAddr);

    expect(erc20SingleRequestProxyBalanceAfter).to.equal(0);
    expect(user2BalanceAfter).to.equal(paymentAmount);
    expect(feeRecipientBalanceAfter).to.equal(feeAmount);
  });

  it.skip('should process a partial payment correctly', async () => {
    // Smart contract does not keep track of the payment amount, it accepts any amount of tokens
  });

  it('should process a payment with a non-standard ERC20', async () => {
    const usdtFeeAmount = BN.from(10).mul(USDT_DECIMAL);
    const usdtProxy = await new ERC20SingleRequestProxy__factory(deployer).deploy(
      user2Addr,
      usdtFake.address,
      paymentReference,
      feeRecipientAddr,
      usdtFeeAmount,
      erc20FeeProxy.address,
    );

    const paymentAmount = BN.from(50).mul(USDT_DECIMAL);
    const totalAmount = paymentAmount.add(usdtFeeAmount);

    await usdtFake.mint(user1Addr, BN.from(1000).mul(USDT_DECIMAL));

    await usdtFake.connect(user1).transfer(usdtProxy.address, totalAmount);

    const usdtProxyBalanceBefore = await usdtFake.balanceOf(usdtProxy.address);
    expect(usdtProxyBalanceBefore).to.equal(totalAmount);

    await expect(
      user1.sendTransaction({
        to: usdtProxy.address,
        value: 0,
      }),
    )
      .to.emit(erc20FeeProxy, 'TransferWithReferenceAndFee')
      .withArgs(
        usdtFake.address,
        user2Addr,
        paymentAmount,
        paymentReference,
        usdtFeeAmount,
        feeRecipientAddr,
      );

    const usdtProxyBalanceAfter = await usdtFake.balanceOf(usdtProxy.address);
    const user2BalanceAfter = await usdtFake.balanceOf(user2Addr);
    const feeRecipientBalanceAfter = await usdtFake.balanceOf(feeRecipientAddr);

    expect(usdtProxyBalanceAfter).to.equal(0);
    expect(user2BalanceAfter).to.equal(paymentAmount);
    expect(feeRecipientBalanceAfter).to.equal(usdtFeeAmount);
  });

  it('should revert if called with non-zero value', async () => {
    await expect(
      user1.sendTransaction({
        to: erc20SingleRequestProxy.address,
        value: 1,
      }),
    ).to.be.revertedWith('This function is only for triggering the transfer');
  });

  it('should handle zero fee amount correctly', async () => {
    const zeroFeeProxy = await new ERC20SingleRequestProxy__factory(deployer).deploy(
      user2Addr,
      testToken.address,
      paymentReference,
      feeRecipientAddr,
      0,
      erc20FeeProxy.address,
    );

    const paymentAmount = BN.from(100).mul(BASE_DECIMAL);
    await testToken.connect(user1).transfer(zeroFeeProxy.address, paymentAmount);

    await expect(
      user1.sendTransaction({
        to: zeroFeeProxy.address,
        value: 0,
      }),
    )
      .to.emit(erc20FeeProxy, 'TransferWithReferenceAndFee')
      .withArgs(
        testToken.address,
        user2Addr,
        paymentAmount,
        ethers.utils.keccak256(paymentReference),
        0,
        feeRecipientAddr,
      );

    expect(await testToken.balanceOf(zeroFeeProxy.address)).to.equal(0);
    expect(await testToken.balanceOf(user2Addr)).to.equal(paymentAmount);
    expect(await testToken.balanceOf(feeRecipientAddr)).to.equal(0);
  });

  it('should revert if there are not enough tokens', async () => {
    const insufficientAmount = BN.from(1).mul(BASE_DECIMAL);
    await testToken.connect(user1).transfer(erc20SingleRequestProxy.address, insufficientAmount);

    await expect(
      user1.sendTransaction({
        to: erc20SingleRequestProxy.address,
        value: 0,
      }),
    ).to.be.reverted;
  });

  it('should rescue ERC20 tokens', async () => {
    const rescueAmount = BN.from(100).mul(BASE_DECIMAL);

    // Transfer tokens directly to the contract
    await testToken.transfer(erc20SingleRequestProxy.address, rescueAmount);

    const contractBalanceBefore = await testToken.balanceOf(erc20SingleRequestProxy.address);
    expect(contractBalanceBefore).to.equal(rescueAmount);

    const payeeBalanceBefore = await testToken.balanceOf(user2Addr);

    await erc20SingleRequestProxy.rescueERC20Funds(testToken.address);

    const contractBalanceAfter = await testToken.balanceOf(erc20SingleRequestProxy.address);
    expect(contractBalanceAfter).to.equal(0);

    const payeeBalanceAfter = await testToken.balanceOf(user2Addr);
    expect(payeeBalanceAfter.sub(payeeBalanceBefore)).to.equal(rescueAmount);
  });

  it('should rescue native funds', async () => {
    const paymentAmount = ethers.utils.parseEther('1');
    const totalAmount = paymentAmount.add(feeAmount);

    const ForceSendFactory = await ethers.getContractFactory('ForceSend');
    const forceSend = await ForceSendFactory.deploy();
    await forceSend.deployed();

    await forceSend.forceSend(erc20SingleRequestProxy.address, { value: totalAmount });

    const contractBalanceBefore = await ethers.provider.getBalance(erc20SingleRequestProxy.address);
    expect(contractBalanceBefore).to.gt(0);

    await erc20SingleRequestProxy.rescueNativeFunds();

    const contractBalanceAfter = await ethers.provider.getBalance(erc20SingleRequestProxy.address);
    expect(contractBalanceAfter).to.equal(0);
  });
});
