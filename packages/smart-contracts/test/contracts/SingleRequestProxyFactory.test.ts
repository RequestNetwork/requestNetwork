import { ethers } from 'hardhat';
import { expect } from 'chai';
import { Signer } from 'ethers';
import {
  SingleRequestProxyFactory,
  EthereumFeeProxy,
  ERC20FeeProxy,
  EthereumSingleRequestProxy,
  ERC20SingleRequestProxy,
  TestToken,
} from '../../src/types';

describe('contract: SingleRequestProxyFactory', () => {
  let singleRequestProxyFactory: SingleRequestProxyFactory;
  let ethereumFeeProxy: EthereumFeeProxy;
  let erc20FeeProxy: ERC20FeeProxy;
  let testToken: TestToken;
  let owner: Signer;
  let user: Signer;
  let payee: Signer;
  let feeRecipient: Signer;
  let ownerAddress: string;
  let userAddress: string;
  let payeeAddress: string;
  let feeRecipientAddress: string;

  const paymentReference: string = ethers.utils.formatBytes32String('payment_reference');
  const feeAmount: string = ethers.utils.parseEther('0.1').toString();

  beforeEach(async () => {
    [owner, user, payee, feeRecipient] = await ethers.getSigners();
    ownerAddress = await owner.getAddress();
    userAddress = await user.getAddress();
    payeeAddress = await payee.getAddress();
    feeRecipientAddress = await feeRecipient.getAddress();

    const EthereumFeeProxyFactory = await ethers.getContractFactory('EthereumFeeProxy');
    ethereumFeeProxy = await EthereumFeeProxyFactory.deploy();
    await ethereumFeeProxy.deployed();

    const ERC20FeeProxyFactory = await ethers.getContractFactory('ERC20FeeProxy');
    erc20FeeProxy = await ERC20FeeProxyFactory.deploy();
    await erc20FeeProxy.deployed();

    const SingleRequestProxyFactoryFactory = await ethers.getContractFactory(
      'SingleRequestProxyFactory',
    );
    singleRequestProxyFactory = await SingleRequestProxyFactoryFactory.deploy(
      ethereumFeeProxy.address,
      erc20FeeProxy.address,
      ownerAddress,
    );
    await singleRequestProxyFactory.deployed();

    const TestTokenFactory = await ethers.getContractFactory('TestToken');
    testToken = await TestTokenFactory.deploy(ownerAddress);
    await testToken.deployed();
  });

  it('should be deployed with correct initial values', async () => {
    expect(singleRequestProxyFactory.address).to.not.equal(ethers.constants.AddressZero);
    expect(await singleRequestProxyFactory.ethereumFeeProxy()).to.equal(ethereumFeeProxy.address);
    expect(await singleRequestProxyFactory.erc20FeeProxy()).to.equal(erc20FeeProxy.address);
    expect(await singleRequestProxyFactory.owner()).to.equal(ownerAddress);
  });

  it('should create a new EthereumSingleRequestProxy and emit event', async () => {
    const tx = await singleRequestProxyFactory.createEthereumSingleRequestProxy(
      payeeAddress,
      paymentReference,
      feeRecipientAddress,
      feeAmount,
    );

    const receipt = await tx.wait();

    expect(receipt.events).to.exist;
    expect(receipt.events).to.have.length(1);
    expect(receipt.events?.[0]?.event).to.equal('EthereumSingleRequestProxyCreated');

    const proxyAddress = receipt.events?.[0]?.args?.[0];

    expect(proxyAddress).to.not.equal(ethers.constants.AddressZero);
    expect(proxyAddress).to.be.properAddress;

    await expect(tx)
      .to.emit(singleRequestProxyFactory, 'EthereumSingleRequestProxyCreated')
      .withArgs(
        proxyAddress,
        payeeAddress,
        paymentReference,
        feeRecipientAddress,
        feeAmount,
        ethereumFeeProxy.address,
      );

    const proxy = (await ethers.getContractAt(
      'EthereumSingleRequestProxy',
      proxyAddress,
    )) as EthereumSingleRequestProxy;
    expect(await proxy.payee()).to.equal(payeeAddress);
    expect(await proxy.paymentReference()).to.equal(paymentReference);
    expect(await proxy.ethereumFeeProxy()).to.equal(ethereumFeeProxy.address);
    expect(await proxy.feeAddress()).to.equal(feeRecipientAddress);
    expect(await proxy.feeAmount()).to.equal(feeAmount);
  });

  it('should create a new ERC20SingleRequestProxy and emit event', async () => {
    const tx = await singleRequestProxyFactory.createERC20SingleRequestProxy(
      payeeAddress,
      testToken.address,
      paymentReference,
      feeRecipientAddress,
      feeAmount,
    );

    const receipt = await tx.wait();

    expect(receipt.events).to.exist;
    expect(receipt.events).to.have.length(1);
    expect(receipt.events?.[0]?.event).to.equal('ERC20SingleRequestProxyCreated');

    const proxyAddress = receipt.events?.[0]?.args?.[0];

    expect(proxyAddress).to.not.equal(ethers.constants.AddressZero);
    expect(proxyAddress).to.be.properAddress;

    await expect(tx)
      .to.emit(singleRequestProxyFactory, 'ERC20SingleRequestProxyCreated')
      .withArgs(
        proxyAddress,
        payeeAddress,
        testToken.address,
        paymentReference,
        feeRecipientAddress,
        feeAmount,
        erc20FeeProxy.address,
      );

    const proxy = (await ethers.getContractAt(
      'ERC20SingleRequestProxy',
      proxyAddress,
    )) as ERC20SingleRequestProxy;
    expect(await proxy.payee()).to.equal(payeeAddress);
    expect(await proxy.tokenAddress()).to.equal(testToken.address);
    expect(await proxy.paymentReference()).to.equal(paymentReference);
    expect(await proxy.erc20FeeProxy()).to.equal(erc20FeeProxy.address);
    expect(await proxy.feeAddress()).to.equal(feeRecipientAddress);
    expect(await proxy.feeAmount()).to.equal(feeAmount);
  });

  it('should update ERC20FeeProxy address when called by owner', async () => {
    const newERC20FeeProxy = await (await ethers.getContractFactory('ERC20FeeProxy')).deploy();
    await newERC20FeeProxy.deployed();

    await singleRequestProxyFactory.setERC20FeeProxy(newERC20FeeProxy.address);
    expect(await singleRequestProxyFactory.erc20FeeProxy()).to.equal(newERC20FeeProxy.address);
  });

  it('should revert when non-owner tries to set ERC20FeeProxy address', async () => {
    const newERC20FeeProxy = await (await ethers.getContractFactory('ERC20FeeProxy')).deploy();
    await newERC20FeeProxy.deployed();

    await expect(
      singleRequestProxyFactory.connect(user).setERC20FeeProxy(newERC20FeeProxy.address),
    ).to.be.revertedWith('Ownable: caller is not the owner');
  });

  it('should update EthereumFeeProxy address when called by owner', async () => {
    const newEthereumFeeProxy = await (
      await ethers.getContractFactory('EthereumFeeProxy')
    ).deploy();
    await newEthereumFeeProxy.deployed();

    await singleRequestProxyFactory.setEthereumFeeProxy(newEthereumFeeProxy.address);
    expect(await singleRequestProxyFactory.ethereumFeeProxy()).to.equal(
      newEthereumFeeProxy.address,
    );
  });

  it('should revert when non-owner tries to set EthereumFeeProxy address', async () => {
    const newEthereumFeeProxy = await (
      await ethers.getContractFactory('EthereumFeeProxy')
    ).deploy();
    await newEthereumFeeProxy.deployed();

    await expect(
      singleRequestProxyFactory.connect(user).setEthereumFeeProxy(newEthereumFeeProxy.address),
    ).to.be.revertedWith('Ownable: caller is not the owner');
  });

  it('should allow owner to transfer ownership', async () => {
    await singleRequestProxyFactory.transferOwnership(userAddress);
    expect(await singleRequestProxyFactory.owner()).to.equal(userAddress);
  });

  it('should allow new owner to renounce ownership', async () => {
    await expect(singleRequestProxyFactory.transferOwnership(userAddress))
      .to.emit(singleRequestProxyFactory, 'OwnershipTransferred')
      .withArgs(ownerAddress, userAddress);
    await expect(singleRequestProxyFactory.connect(user).renounceOwnership())
      .to.emit(singleRequestProxyFactory, 'OwnershipTransferred')
      .withArgs(userAddress, ethers.constants.AddressZero);
    expect(await singleRequestProxyFactory.owner()).to.equal(ethers.constants.AddressZero);
  });

  it('should revert when non-owner tries to transfer ownership', async () => {
    await expect(
      singleRequestProxyFactory.connect(user).transferOwnership(userAddress),
    ).to.be.revertedWith('Ownable: caller is not the owner');
  });

  it('should revert when non-owner tries to renounce ownership', async () => {
    await expect(singleRequestProxyFactory.connect(user).renounceOwnership()).to.be.revertedWith(
      'Ownable: caller is not the owner',
    );
  });
});
