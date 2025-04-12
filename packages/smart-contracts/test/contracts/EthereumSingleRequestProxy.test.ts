import { ethers } from 'hardhat';
import { expect } from 'chai';
import { BigNumber, Signer } from 'ethers';
import { EthereumSingleRequestProxy, EthereumFeeProxy, TestToken__factory } from '../../src/types';
import { BigNumber as BN } from 'ethers';
describe('contract : EthereumSingleRequestProxy', () => {
  let ethereumSingleRequestProxy: EthereumSingleRequestProxy;
  let ethereumFeeProxy: EthereumFeeProxy;
  let owner: Signer;
  let payee: Signer;
  let feeRecipient: Signer;
  let payeeAddress: string;
  let feeRecipientAddress: string;

  const paymentReference: string = ethers.utils.formatBytes32String('payment_reference');
  const feeAmount: BN = ethers.utils.parseEther('0.1');

  beforeEach(async () => {
    [owner, payee, feeRecipient] = await ethers.getSigners();
    payeeAddress = await payee.getAddress();
    feeRecipientAddress = await feeRecipient.getAddress();

    const ethereumFeeProxyFactory = await ethers.getContractFactory('EthereumFeeProxy');
    ethereumFeeProxy = await ethereumFeeProxyFactory.deploy();
    await ethereumFeeProxy.deployed();

    const ethereumSingleRequestProxyFactory = await ethers.getContractFactory(
      'EthereumSingleRequestProxy',
    );
    ethereumSingleRequestProxy = await ethereumSingleRequestProxyFactory.deploy(
      payeeAddress,
      paymentReference,
      feeRecipientAddress,
      feeAmount,
      ethereumFeeProxy.address,
    );
    await ethereumSingleRequestProxy.deployed();
  });

  it('should be deployed', async () => {
    expect(ethereumSingleRequestProxy.address).to.not.equal(ethers.constants.AddressZero);
  });

  it('should set the correct initial values', async () => {
    expect(await ethereumSingleRequestProxy.payee()).to.equal(payeeAddress);
    expect(await ethereumSingleRequestProxy.paymentReference()).to.equal(paymentReference);
    expect(await ethereumSingleRequestProxy.ethereumFeeProxy()).to.equal(ethereumFeeProxy.address);
    expect(await ethereumSingleRequestProxy.feeAddress()).to.equal(feeRecipientAddress);
    expect(await ethereumSingleRequestProxy.feeAmount()).to.equal(feeAmount);
  });

  it('should process a payment correctly and emit event', async () => {
    const paymentAmount = ethers.utils.parseEther('1');
    const totalAmount = BigNumber.from(paymentAmount).add(BigNumber.from(feeAmount));

    await expect(
      await owner.sendTransaction({
        to: ethereumSingleRequestProxy.address,
        value: totalAmount,
      }),
    ).to.changeEtherBalances(
      [owner, payee, feeRecipient],
      [totalAmount.mul(-1), paymentAmount, feeAmount],
    );

    await expect(
      owner.sendTransaction({
        to: ethereumSingleRequestProxy.address,
        value: totalAmount,
      }),
    )
      .to.emit(ethereumFeeProxy, 'TransferWithReferenceAndFee')
      .withArgs(payeeAddress, paymentAmount, paymentReference, feeAmount, feeRecipientAddress);

    expect(await ethers.provider.getBalance(ethereumSingleRequestProxy.address)).to.equal(0);
    expect(await ethers.provider.getBalance(ethereumFeeProxy.address)).to.equal(0);
  });

  it('should handle funds sent back from EthereumFeeProxy', async () => {
    const MockEthereumFeeProxyFactory = await ethers.getContractFactory('MockEthereumFeeProxy');
    const mockEthereumFeeProxy = await MockEthereumFeeProxyFactory.deploy();
    await mockEthereumFeeProxy.deployed();

    const newEthereumSingleRequestProxyFactory = await ethers.getContractFactory(
      'EthereumSingleRequestProxy',
    );
    const newEthereumSingleRequestProxy = await newEthereumSingleRequestProxyFactory.deploy(
      payeeAddress,
      paymentReference,
      feeRecipientAddress,
      feeAmount,
      mockEthereumFeeProxy.address,
    );
    await newEthereumSingleRequestProxy.deployed();

    const paymentAmount = ethers.utils.parseEther('1');
    const totalAmount = paymentAmount.add(feeAmount);

    await owner.sendTransaction({
      to: newEthereumSingleRequestProxy.address,
      value: totalAmount,
    });

    expect(await ethers.provider.getBalance(newEthereumSingleRequestProxy.address)).to.equal(0);
    expect(await ethers.provider.getBalance(mockEthereumFeeProxy.address)).to.equal(totalAmount);

    await expect(() =>
      mockEthereumFeeProxy.sendFundsBack(newEthereumSingleRequestProxy.address, totalAmount),
    ).to.changeEtherBalances(
      [owner, newEthereumSingleRequestProxy, mockEthereumFeeProxy],
      [totalAmount, 0, totalAmount.mul(-1)],
    );

    expect(await ethers.provider.getBalance(newEthereumSingleRequestProxy.address)).to.equal(0);
    expect(await ethers.provider.getBalance(mockEthereumFeeProxy.address)).to.equal(0);
  });

  it('should rescue native funds', async () => {
    const paymentAmount = ethers.utils.parseEther('1');
    const totalAmount = paymentAmount.add(feeAmount);

    const ForceSendFactory = await ethers.getContractFactory('ForceSend');
    const forceSend = await ForceSendFactory.deploy();
    await forceSend.deployed();

    await forceSend.forceSend(ethereumSingleRequestProxy.address, { value: totalAmount });

    const balanceAfterForceSend = await ethers.provider.getBalance(
      ethereumSingleRequestProxy.address,
    );
    expect(balanceAfterForceSend).to.be.gt(0);
    expect(balanceAfterForceSend).to.equal(totalAmount);

    const initialPayeeBalance = await ethers.provider.getBalance(payeeAddress);

    await ethereumSingleRequestProxy.rescueNativeFunds();

    expect(await ethers.provider.getBalance(ethereumSingleRequestProxy.address)).to.equal(0);

    const finalPayeeBalance = await ethers.provider.getBalance(payeeAddress);
    expect(finalPayeeBalance.sub(initialPayeeBalance)).to.equal(balanceAfterForceSend);
  });

  it('should rescue ERC20 funds', async () => {
    const rescueAmount = BN.from(100).mul(18);
    const [deployer] = await ethers.getSigners();

    const deployerAddr = await deployer.getAddress();
    const testToken = await new TestToken__factory(deployer).deploy(deployerAddr);
    await testToken.mint(deployerAddr, BN.from(1000000).mul(18));

    await testToken.transfer(ethereumSingleRequestProxy.address, rescueAmount);

    const contractBalanceBefore = await testToken.balanceOf(ethereumSingleRequestProxy.address);

    const initialPayeeBalance = await testToken.balanceOf(payeeAddress);
    expect(initialPayeeBalance).to.equal(0);
    expect(contractBalanceBefore).to.equal(rescueAmount);

    await ethereumSingleRequestProxy.rescueERC20Funds(testToken.address);

    const contractBalanceAfter = await testToken.balanceOf(ethereumSingleRequestProxy.address);
    ethereumSingleRequestProxy.address, expect(contractBalanceAfter).to.equal(0);

    const finalPayeeBalance = await testToken.balanceOf(payeeAddress);
    expect(finalPayeeBalance.sub(initialPayeeBalance)).to.equal(rescueAmount);
  });
});
