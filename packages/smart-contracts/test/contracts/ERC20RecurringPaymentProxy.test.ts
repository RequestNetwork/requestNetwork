import { ethers } from 'hardhat';
import { expect, use } from 'chai';
import { solidity } from 'ethereum-waffle';
import { Contract, Signer } from 'ethers';
import { ERC20FeeProxy__factory, ERC20FeeProxy, TestERC20__factory, TestERC20 } from '../../types';

use(solidity);

describe('ERC20RecurringPaymentProxy', () => {
  let erc20RecurringPaymentProxy: Contract;
  let erc20FeeProxy: ERC20FeeProxy;
  let testERC20: TestERC20;

  let owner: Signer;
  let executor: Signer;
  let user: Signer;
  let newExecutor: Signer;
  let newOwner: Signer;

  let ownerAddress: string;
  let executorAddress: string;
  let userAddress: string;
  let newExecutorAddress: string;
  let newOwnerAddress: string;

  beforeEach(async () => {
    [owner, executor, user, newExecutor, newOwner] = await ethers.getSigners();
    ownerAddress = await owner.getAddress();
    executorAddress = await executor.getAddress();
    userAddress = await user.getAddress();
    newExecutorAddress = await newExecutor.getAddress();
    newOwnerAddress = await newOwner.getAddress();

    // Deploy ERC20FeeProxy
    const ERC20FeeProxyFactory = await ethers.getContractFactory('ERC20FeeProxy');
    erc20FeeProxy = await ERC20FeeProxyFactory.deploy();
    await erc20FeeProxy.deployed();

    // Deploy ERC20RecurringPaymentProxy
    const ERC20RecurringPaymentProxyFactory = await ethers.getContractFactory(
      'ERC20RecurringPaymentProxy',
    );
    erc20RecurringPaymentProxy = await ERC20RecurringPaymentProxyFactory.deploy(
      ownerAddress,
      executorAddress,
      erc20FeeProxy.address,
    );
    await erc20RecurringPaymentProxy.deployed();

    // Deploy test ERC20 token
    const TestERC20Factory = await ethers.getContractFactory('TestERC20');
    testERC20 = await TestERC20Factory.deploy(1000);
    await testERC20.deployed();
  });

  describe('Deployment', () => {
    it('should be deployed with correct initial values', async () => {
      expect(erc20RecurringPaymentProxy.address).to.not.equal(ethers.constants.AddressZero);
      expect(await erc20RecurringPaymentProxy.erc20FeeProxy()).to.equal(erc20FeeProxy.address);
      expect(await erc20RecurringPaymentProxy.owner()).to.equal(ownerAddress);
      expect(
        await erc20RecurringPaymentProxy.hasRole(
          await erc20RecurringPaymentProxy.EXECUTOR_ROLE(),
          executorAddress,
        ),
      ).to.be.true;
      expect(
        await erc20RecurringPaymentProxy.hasRole(
          await erc20RecurringPaymentProxy.DEFAULT_ADMIN_ROLE(),
          ownerAddress,
        ),
      ).to.be.true;
    });

    it('should be unpaused by default', async () => {
      expect(await erc20RecurringPaymentProxy.paused()).to.be.false;
    });
  });

  describe('Access Control', () => {
    it('should have correct role constants', async () => {
      const EXECUTOR_ROLE = await erc20RecurringPaymentProxy.EXECUTOR_ROLE();
      const DEFAULT_ADMIN_ROLE = await erc20RecurringPaymentProxy.DEFAULT_ADMIN_ROLE();

      expect(EXECUTOR_ROLE).to.equal(
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes('EXECUTOR_ROLE')),
      );
      expect(DEFAULT_ADMIN_ROLE).to.equal(ethers.constants.HashZero);
    });

    it('should grant executor role to the specified address', async () => {
      expect(
        await erc20RecurringPaymentProxy.hasRole(
          await erc20RecurringPaymentProxy.EXECUTOR_ROLE(),
          executorAddress,
        ),
      ).to.be.true;
    });

    it('should grant admin role to the specified address', async () => {
      expect(
        await erc20RecurringPaymentProxy.hasRole(
          await erc20RecurringPaymentProxy.DEFAULT_ADMIN_ROLE(),
          ownerAddress,
        ),
      ).to.be.true;
    });
  });

  describe('setExecutor', () => {
    it('should allow owner to set new executor', async () => {
      await erc20RecurringPaymentProxy.setExecutor(executorAddress, newExecutorAddress);

      expect(
        await erc20RecurringPaymentProxy.hasRole(
          await erc20RecurringPaymentProxy.EXECUTOR_ROLE(),
          executorAddress,
        ),
      ).to.be.false;
      expect(
        await erc20RecurringPaymentProxy.hasRole(
          await erc20RecurringPaymentProxy.EXECUTOR_ROLE(),
          newExecutorAddress,
        ),
      ).to.be.true;
    });

    it('should revert when non-owner tries to set executor', async () => {
      await expect(
        erc20RecurringPaymentProxy.connect(user).setExecutor(executorAddress, newExecutorAddress),
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('should emit RoleRevoked and RoleGranted events', async () => {
      await expect(erc20RecurringPaymentProxy.setExecutor(executorAddress, newExecutorAddress))
        .to.emit(erc20RecurringPaymentProxy, 'RoleRevoked')
        .withArgs(await erc20RecurringPaymentProxy.EXECUTOR_ROLE(), executorAddress, ownerAddress)
        .and.to.emit(erc20RecurringPaymentProxy, 'RoleGranted')
        .withArgs(
          await erc20RecurringPaymentProxy.EXECUTOR_ROLE(),
          newExecutorAddress,
          ownerAddress,
        );
    });
  });

  describe('setFeeProxy', () => {
    it('should allow owner to set new fee proxy', async () => {
      const newERC20FeeProxy = await (await ethers.getContractFactory('ERC20FeeProxy')).deploy();
      await newERC20FeeProxy.deployed();

      await erc20RecurringPaymentProxy.setFeeProxy(newERC20FeeProxy.address);
      expect(await erc20RecurringPaymentProxy.erc20FeeProxy()).to.equal(newERC20FeeProxy.address);
    });

    it('should revert when non-owner tries to set fee proxy', async () => {
      const newERC20FeeProxy = await (await ethers.getContractFactory('ERC20FeeProxy')).deploy();
      await newERC20FeeProxy.deployed();

      await expect(
        erc20RecurringPaymentProxy.connect(user).setFeeProxy(newERC20FeeProxy.address),
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('should revert when trying to set zero address as fee proxy', async () => {
      await expect(erc20RecurringPaymentProxy.setFeeProxy(ethers.constants.AddressZero)).to.be
        .reverted;
    });
  });

  describe('Pausable functionality', () => {
    it('should allow owner to pause the contract', async () => {
      await erc20RecurringPaymentProxy.pause();
      expect(await erc20RecurringPaymentProxy.paused()).to.be.true;
    });

    it('should allow owner to unpause the contract', async () => {
      await erc20RecurringPaymentProxy.pause();
      expect(await erc20RecurringPaymentProxy.paused()).to.be.true;

      await erc20RecurringPaymentProxy.unpause();
      expect(await erc20RecurringPaymentProxy.paused()).to.be.false;
    });

    it('should revert when non-owner tries to pause', async () => {
      await expect(erc20RecurringPaymentProxy.connect(user).pause()).to.be.revertedWith(
        'Ownable: caller is not the owner',
      );
    });

    it('should revert when non-owner tries to unpause', async () => {
      await erc20RecurringPaymentProxy.pause();

      await expect(erc20RecurringPaymentProxy.connect(user).unpause()).to.be.revertedWith(
        'Ownable: caller is not the owner',
      );
    });

    it('should emit Paused event when paused', async () => {
      await expect(erc20RecurringPaymentProxy.pause())
        .to.emit(erc20RecurringPaymentProxy, 'Paused')
        .withArgs(ownerAddress);
    });

    it('should emit Unpaused event when unpaused', async () => {
      await erc20RecurringPaymentProxy.pause();

      await expect(erc20RecurringPaymentProxy.unpause())
        .to.emit(erc20RecurringPaymentProxy, 'Unpaused')
        .withArgs(ownerAddress);
    });
  });

  describe('Ownership', () => {
    it('should allow owner to transfer ownership', async () => {
      await erc20RecurringPaymentProxy.transferOwnership(newOwnerAddress);
      expect(await erc20RecurringPaymentProxy.owner()).to.equal(newOwnerAddress);
    });

    it('should revert when non-owner tries to transfer ownership', async () => {
      await expect(
        erc20RecurringPaymentProxy.connect(user).transferOwnership(newOwnerAddress),
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('should emit OwnershipTransferred event', async () => {
      await expect(erc20RecurringPaymentProxy.transferOwnership(newOwnerAddress))
        .to.emit(erc20RecurringPaymentProxy, 'OwnershipTransferred')
        .withArgs(ownerAddress, newOwnerAddress);
    });

    it('should allow new owner to renounce ownership', async () => {
      await erc20RecurringPaymentProxy.transferOwnership(newOwnerAddress);

      await expect(erc20RecurringPaymentProxy.connect(newOwner).renounceOwnership())
        .to.emit(erc20RecurringPaymentProxy, 'OwnershipTransferred')
        .withArgs(newOwnerAddress, ethers.constants.AddressZero);

      expect(await erc20RecurringPaymentProxy.owner()).to.equal(ethers.constants.AddressZero);
    });

    it('should revert when non-owner tries to renounce ownership', async () => {
      await expect(erc20RecurringPaymentProxy.connect(user).renounceOwnership()).to.be.revertedWith(
        'Ownable: caller is not the owner',
      );
    });
  });

  describe('Integration: Paused state affects execution', () => {
    it('should revert execute when contract is paused', async () => {
      await erc20RecurringPaymentProxy.pause();

      // Create a minimal SchedulePermit for testing
      const schedulePermit = {
        subscriber: userAddress,
        token: testERC20.address,
        recipient: userAddress,
        feeAddress: userAddress,
        amount: 100,
        feeAmount: 10,
        gasFee: 5,
        periodSeconds: 3600,
        firstExec: Math.floor(Date.now() / 1000),
        totalExecutions: 1,
        nonce: 0,
        deadline: Math.floor(Date.now() / 1000) + 3600,
      };

      const signature = '0x' + '0'.repeat(130); // Dummy signature
      const paymentReference = '0x1234';

      await expect(
        erc20RecurringPaymentProxy
          .connect(executor)
          .execute(schedulePermit, signature, 1, paymentReference),
      ).to.be.revertedWith('Pausable: paused');
    });
  });
});
