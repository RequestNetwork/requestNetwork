import { expect } from 'chai';
import { Contract, Signer } from 'ethers';
import { ethers } from 'hardhat';
import { ERC20FeeProxy, TestERC20 } from '../../types';

describe('ERC20RecurringPaymentProxy', () => {
  let erc20RecurringPaymentProxy: Contract;
  let erc20FeeProxy: ERC20FeeProxy;
  let testERC20: TestERC20;

  let owner: Signer;
  let relayer: Signer;
  let user: Signer;
  let newRelayer: Signer;
  let newOwner: Signer;
  let subscriber: Signer;
  let recipient: Signer;
  let feeAddress: Signer;

  let ownerAddress: string;
  let relayerAddress: string;
  let userAddress: string;
  let newRelayerAddress: string;
  let newOwnerAddress: string;
  let subscriberAddress: string;
  let recipientAddress: string;
  let feeAddressString: string;

  let paymentReference: string;
  const RELAYER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('RELAYER_ROLE'));

  beforeEach(async () => {
    [owner, relayer, user, newRelayer, newOwner, subscriber, recipient, feeAddress] =
      await ethers.getSigners();
    ownerAddress = await owner.getAddress();
    relayerAddress = await relayer.getAddress();
    userAddress = await user.getAddress();
    newRelayerAddress = await newRelayer.getAddress();
    newOwnerAddress = await newOwner.getAddress();
    subscriberAddress = await subscriber.getAddress();
    recipientAddress = await recipient.getAddress();
    feeAddressString = await feeAddress.getAddress();
    paymentReference = ethers.utils.hexlify(ethers.utils.toUtf8Bytes('test'));

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
      relayerAddress,
      erc20FeeProxy.address,
    );
    await erc20RecurringPaymentProxy.deployed();

    // Deploy test ERC20 token
    const TestERC20Factory = await ethers.getContractFactory('TestERC20');
    testERC20 = await TestERC20Factory.deploy(1000);
    await testERC20.deployed();
  });

  // Helper function to create a valid SchedulePermit
  const createSchedulePermit = (overrides: any = {}) => {
    const now = Math.floor(Date.now() / 1000);
    return {
      subscriber: subscriberAddress,
      token: testERC20.address,
      recipient: recipientAddress,
      feeAddress: feeAddressString,
      amount: ethers.BigNumber.from(100),
      feeAmount: ethers.BigNumber.from(10),
      relayerFee: ethers.BigNumber.from(5),
      periodSeconds: 3600,
      firstPayment: now,
      totalPayments: 3,
      nonce: ethers.BigNumber.from(0),
      deadline: now + 86400, // 24 hours from now
      strictOrder: false,
      ...overrides,
    };
  };

  // Helper function to create EIP712 signature
  const createSignature = async (permit: any, signer: Signer) => {
    const domain = {
      name: 'ERC20RecurringPaymentProxy',
      version: '1',
      chainId: await signer.getChainId(),
      verifyingContract: erc20RecurringPaymentProxy.address,
    };

    const types = {
      SchedulePermit: [
        { name: 'subscriber', type: 'address' },
        { name: 'token', type: 'address' },
        { name: 'recipient', type: 'address' },
        { name: 'feeAddress', type: 'address' },
        { name: 'amount', type: 'uint128' },
        { name: 'feeAmount', type: 'uint128' },
        { name: 'relayerFee', type: 'uint128' },
        { name: 'periodSeconds', type: 'uint32' },
        { name: 'firstPayment', type: 'uint32' },
        { name: 'totalPayments', type: 'uint8' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
        { name: 'strictOrder', type: 'bool' },
      ],
    };

    const address = await signer.getAddress();

    try {
      // Fallback to ethers helper (works in most in-process Hardhat environments)
      return await (signer as any)._signTypedData(domain, types, permit);
    } catch (_) {
      // This matches the spec used by Hardhat JSON-RPC & Ganache
      const typedDataObject = {
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
          ],
          ...types,
        },
        primaryType: 'SchedulePermit',
        domain,
        message: permit,
      };
      return await (signer.provider as any).send('eth_signTypedData', [address, typedDataObject]);
    }
  };

  describe('Deployment', () => {
    it('should be deployed with correct initial values', async () => {
      expect(erc20RecurringPaymentProxy.address).to.not.equal(ethers.constants.AddressZero);
      expect(await erc20RecurringPaymentProxy.erc20FeeProxy()).to.equal(erc20FeeProxy.address);
      expect(await erc20RecurringPaymentProxy.owner()).to.equal(ownerAddress);
      expect(await erc20RecurringPaymentProxy.hasRole(RELAYER_ROLE, relayerAddress)).to.be.true;
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
      const DEFAULT_ADMIN_ROLE = await erc20RecurringPaymentProxy.DEFAULT_ADMIN_ROLE();
      expect(RELAYER_ROLE).to.equal(
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes('RELAYER_ROLE')),
      );
      expect(DEFAULT_ADMIN_ROLE).to.equal(ethers.constants.HashZero);
    });

    it('should grant relayer role to the specified address', async () => {
      expect(await erc20RecurringPaymentProxy.hasRole(RELAYER_ROLE, relayerAddress)).to.be.true;
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

  describe('setRelayer', () => {
    it('should allow owner to set new relayer', async () => {
      await erc20RecurringPaymentProxy.setRelayer(relayerAddress, newRelayerAddress);

      expect(await erc20RecurringPaymentProxy.hasRole(RELAYER_ROLE, relayerAddress)).to.be.false;
      expect(await erc20RecurringPaymentProxy.hasRole(RELAYER_ROLE, newRelayerAddress)).to.be.true;
    });

    it('should revert when non-owner tries to set relayer', async () => {
      await expect(
        erc20RecurringPaymentProxy.connect(user).setRelayer(relayerAddress, newRelayerAddress),
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('should emit RoleRevoked and RoleGranted events', async () => {
      await expect(erc20RecurringPaymentProxy.setRelayer(relayerAddress, newRelayerAddress))
        .to.emit(erc20RecurringPaymentProxy, 'RoleRevoked')
        .withArgs(RELAYER_ROLE, relayerAddress, ownerAddress)
        .and.to.emit(erc20RecurringPaymentProxy, 'RoleGranted')
        .withArgs(RELAYER_ROLE, newRelayerAddress, ownerAddress);
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

  describe('triggerRecurringPayment', () => {
    beforeEach(async () => {
      // Transfer tokens to subscriber and approve the recurring payment proxy
      await testERC20.transfer(subscriberAddress, 500);
      await testERC20.connect(subscriber).approve(erc20RecurringPaymentProxy.address, 500);
    });

    it('should revert if not called by relayer', async () => {
      const permit = createSchedulePermit();
      const signature = await createSignature(permit, subscriber);
      const subscriberAddr = await subscriber.getAddress();

      await expect(
        erc20RecurringPaymentProxy
          .connect(subscriber)
          .triggerRecurringPayment(permit, signature, 1, paymentReference),
      ).to.be.revertedWith(
        `AccessControl: account ${subscriberAddr.toLowerCase()} is missing role ${RELAYER_ROLE}`,
      );
    });

    it('should revert if signature is invalid', async () => {
      const permit = createSchedulePermit();
      const signature = await createSignature(permit, subscriber);

      // Modify the signature to make it invalid
      const invalidSignature = signature.slice(0, -2) + '00';

      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPayment(permit, invalidSignature, 1, paymentReference),
      ).to.be.reverted;
    });

    it('should trigger a valid recurring payment', async () => {
      const permit = createSchedulePermit();
      const signature = await createSignature(permit, subscriber);

      const subscriberBalanceBefore = await testERC20.balanceOf(subscriberAddress);
      const recipientBalanceBefore = await testERC20.balanceOf(recipientAddress);
      const feeAddressBalanceBefore = await testERC20.balanceOf(feeAddressString);
      const relayerBalanceBefore = await testERC20.balanceOf(relayerAddress);

      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPayment(permit, signature, 1, paymentReference),
      )
        .to.emit(erc20FeeProxy, 'TransferWithReferenceAndFee')
        .withArgs(
          testERC20.address,
          recipientAddress,
          permit.amount,
          ethers.utils.keccak256(paymentReference),
          permit.feeAmount,
          feeAddressString,
        );

      // Check balance changes
      const subscriberBalanceAfter = await testERC20.balanceOf(subscriberAddress);
      const recipientBalanceAfter = await testERC20.balanceOf(recipientAddress);
      const feeAddressBalanceAfter = await testERC20.balanceOf(feeAddressString);
      const relayerBalanceAfter = await testERC20.balanceOf(relayerAddress);

      expect(subscriberBalanceAfter).to.equal(subscriberBalanceBefore.sub(115)); // amount + fee + relayer fee
      expect(recipientBalanceAfter).to.equal(recipientBalanceBefore.add(100)); // amount
      expect(feeAddressBalanceAfter).to.equal(feeAddressBalanceBefore.add(10)); // fee
      expect(relayerBalanceAfter).to.equal(relayerBalanceBefore.add(5)); // relayer fee
    });

    it('should revert when contract is paused', async () => {
      await erc20RecurringPaymentProxy.pause();

      const permit = createSchedulePermit();
      const signature = await createSignature(permit, subscriber);

      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPayment(permit, signature, 1, paymentReference),
      ).to.be.revertedWith('Pausable: paused');
    });

    it('should revert when payment is not due yet', async () => {
      const permit = createSchedulePermit({
        firstPayment: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      });
      const signature = await createSignature(permit, subscriber);

      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPayment(permit, signature, 1, paymentReference),
      ).to.be.revertedWith('ERC20RecurringPaymentProxy__NotDueYet');
    });

    it('should revert when payment is already triggered', async () => {
      const permit = createSchedulePermit();
      const signature = await createSignature(permit, subscriber);

      // Trigger first time
      await erc20RecurringPaymentProxy
        .connect(relayer)
        .triggerRecurringPayment(permit, signature, 1, paymentReference);

      // Try to trigger the same index again
      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPayment(permit, signature, 1, paymentReference),
      ).to.be.revertedWith('ERC20RecurringPaymentProxy__AlreadyPaid');
    });

    it('should allow sequential triggering of multiple payments', async () => {
      const permit = createSchedulePermit({ totalPayments: 3, periodSeconds: 1 });
      const signature = await createSignature(permit, subscriber);

      // Trigger first payment
      await erc20RecurringPaymentProxy
        .connect(relayer)
        .triggerRecurringPayment(permit, signature, 1, paymentReference);

      // Advance time by periodSeconds to allow second payment
      await ethers.provider.send('evm_increaseTime', [permit.periodSeconds]);
      await ethers.provider.send('evm_mine', []);

      // Trigger second payment
      await erc20RecurringPaymentProxy
        .connect(relayer)
        .triggerRecurringPayment(permit, signature, 2, paymentReference);

      // Advance time by periodSeconds to allow third payment
      await ethers.provider.send('evm_increaseTime', [permit.periodSeconds]);
      await ethers.provider.send('evm_mine', []);

      // Trigger third payment
      await erc20RecurringPaymentProxy
        .connect(relayer)
        .triggerRecurringPayment(permit, signature, 3, paymentReference);

      // Verify all payments were triggered
      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPayment(permit, signature, 1, paymentReference),
      ).to.be.revertedWith('ERC20RecurringPaymentProxy__AlreadyPaid');

      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPayment(permit, signature, 2, paymentReference),
      ).to.be.revertedWith('ERC20RecurringPaymentProxy__AlreadyPaid');

      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPayment(permit, signature, 3, paymentReference),
      ).to.be.revertedWith('ERC20RecurringPaymentProxy__AlreadyPaid');
    });

    it('should handle zero relayer fee correctly', async () => {
      const permit = createSchedulePermit({ relayerFee: ethers.BigNumber.from(0) });
      const signature = await createSignature(permit, subscriber);

      const relayerBalanceBefore = await testERC20.balanceOf(relayerAddress);

      await erc20RecurringPaymentProxy
        .connect(relayer)
        .triggerRecurringPayment(permit, signature, 1, paymentReference);

      const relayerBalanceAfter = await testERC20.balanceOf(relayerAddress);
      expect(relayerBalanceAfter).to.equal(relayerBalanceBefore); // No relayer fee transferred
    });

    it('should handle zero fee amount correctly', async () => {
      const permit = createSchedulePermit({ feeAmount: ethers.BigNumber.from(0) });
      const signature = await createSignature(permit, subscriber);

      const feeAddressBalanceBefore = await testERC20.balanceOf(feeAddressString);

      await erc20RecurringPaymentProxy
        .connect(relayer)
        .triggerRecurringPayment(permit, signature, 1, paymentReference);

      const feeAddressBalanceAfter = await testERC20.balanceOf(feeAddressString);
      expect(feeAddressBalanceAfter).to.equal(feeAddressBalanceBefore);
    });

    it('should revert when subscriber has insufficient balance', async () => {
      const permit = createSchedulePermit({ amount: ethers.BigNumber.from(1000) });
      const signature = await createSignature(permit, subscriber);

      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPayment(permit, signature, 1, paymentReference),
      ).to.be.reverted;
    });

    it('should revert when subscriber has insufficient allowance', async () => {
      const permit = createSchedulePermit();
      const signature = await createSignature(permit, subscriber);

      // Revoke approval
      await testERC20.connect(subscriber).approve(erc20RecurringPaymentProxy.address, 0);

      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPayment(permit, signature, 1, paymentReference),
      ).to.be.reverted;
    });
  });
});
