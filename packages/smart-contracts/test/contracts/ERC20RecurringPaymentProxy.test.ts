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
      amount: 100,
      feeAmount: 10,
      relayerFee: 5,
      periodSeconds: 3600,
      firstPayment: now,
      totalPayments: 3,
      nonce: 0,
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

    // Some providers (Hardhat in-process) happily accept the string-encoded data (what
    // ethers' _signTypedData sends). Others (Hardhat JSON-RPC, Ganache) expect the object
    // version. To work everywhere we try the object version first and fall back to
    // the built-in helper if the call is rejected.

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

    const address = await signer.getAddress();
    try {
      // This matches the spec used by Hardhat JSON-RPC & Ganache
      return await (signer.provider as any).send('eth_signTypedData', [address, typedDataObject]);
    } catch (_) {
      // Fallback to ethers helper (works in most in-process Hardhat environments)
      return await (signer as any)._signTypedData(domain, types, permit);
    }
  };

  describe('Deployment', () => {
    it('should be deployed with correct initial values', async () => {
      expect(erc20RecurringPaymentProxy.address).to.not.equal(ethers.constants.AddressZero);
      expect(await erc20RecurringPaymentProxy.erc20FeeProxy()).to.equal(erc20FeeProxy.address);
      expect(await erc20RecurringPaymentProxy.owner()).to.equal(ownerAddress);
      expect(
        await erc20RecurringPaymentProxy.hasRole(
          await erc20RecurringPaymentProxy.RELAYER_ROLE(),
          relayerAddress,
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
      const RELAYER_ROLE = await erc20RecurringPaymentProxy.RELAYER_ROLE();
      const DEFAULT_ADMIN_ROLE = await erc20RecurringPaymentProxy.DEFAULT_ADMIN_ROLE();

      expect(RELAYER_ROLE).to.equal(
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes('RELAYER_ROLE')),
      );
      expect(DEFAULT_ADMIN_ROLE).to.equal(ethers.constants.HashZero);
    });

    it('should grant relayer role to the specified address', async () => {
      expect(
        await erc20RecurringPaymentProxy.hasRole(
          await erc20RecurringPaymentProxy.RELAYER_ROLE(),
          relayerAddress,
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

  describe('setRelayer', () => {
    it('should allow owner to set new relayer', async () => {
      await erc20RecurringPaymentProxy.setRelayer(relayerAddress, newRelayerAddress);

      expect(
        await erc20RecurringPaymentProxy.hasRole(
          await erc20RecurringPaymentProxy.RELAYER_ROLE(),
          relayerAddress,
        ),
      ).to.be.false;
      expect(
        await erc20RecurringPaymentProxy.hasRole(
          await erc20RecurringPaymentProxy.RELAYER_ROLE(),
          newRelayerAddress,
        ),
      ).to.be.true;
    });

    it('should revert when non-owner tries to set relayer', async () => {
      await expect(
        erc20RecurringPaymentProxy.connect(user).setRelayer(relayerAddress, newRelayerAddress),
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('should emit RoleRevoked and RoleGranted events', async () => {
      await expect(erc20RecurringPaymentProxy.setRelayer(relayerAddress, newRelayerAddress))
        .to.emit(erc20RecurringPaymentProxy, 'RoleRevoked')
        .withArgs(await erc20RecurringPaymentProxy.RELAYER_ROLE(), relayerAddress, ownerAddress)
        .and.to.emit(erc20RecurringPaymentProxy, 'RoleGranted')
        .withArgs(await erc20RecurringPaymentProxy.RELAYER_ROLE(), newRelayerAddress, ownerAddress);
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

  describe('Trigger Recurring Payment', () => {
    beforeEach(async () => {
      // Transfer tokens to subscriber and approve the recurring payment proxy
      await testERC20.transfer(subscriberAddress, 500);
      await testERC20.connect(subscriber).approve(erc20RecurringPaymentProxy.address, 500);
    });

    it('should trigger a valid recurring payment', async () => {
      const permit = createSchedulePermit();
      const signature = await createSignature(permit, subscriber);
      const paymentReference = '0x1234567890abcdef';

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

      expect(subscriberBalanceAfter).to.equal(subscriberBalanceBefore.sub(115)); // amount + fee + gas
      expect(recipientBalanceAfter).to.equal(recipientBalanceBefore.add(100)); // amount
      expect(feeAddressBalanceAfter).to.equal(feeAddressBalanceBefore.add(10)); // fee
      expect(relayerBalanceAfter).to.equal(relayerBalanceBefore.add(5)); // gas fee
    });

    it('should revert when called by non-relayer', async () => {
      const permit = createSchedulePermit();
      const signature = await createSignature(permit, subscriber);
      const paymentReference = '0x1234567890abcdef';

      await expect(
        erc20RecurringPaymentProxy
          .connect(user)
          .triggerRecurringPayment(permit, signature, 1, paymentReference),
      ).to.be.revertedWith('AccessControl: account');
    });

    it('should revert when contract is paused', async () => {
      await erc20RecurringPaymentProxy.pause();

      const permit = createSchedulePermit();
      const signature = await createSignature(permit, subscriber);
      const paymentReference = '0x1234567890abcdef';

      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPayment(permit, signature, 1, paymentReference),
      ).to.be.revertedWith('Pausable: paused');
    });

    it('should revert with bad signature', async () => {
      const permit = createSchedulePermit();
      const signature = await createSignature(permit, user); // Wrong signer
      const paymentReference = '0x1234567890abcdef';

      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPayment(permit, signature, 1, paymentReference),
      ).to.be.reverted;
    });

    it('should revert when signature is expired', async () => {
      const permit = createSchedulePermit({
        deadline: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      });
      const signature = await createSignature(permit, subscriber);
      const paymentReference = '0x1234567890abcdef';

      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPayment(permit, signature, 1, paymentReference),
      ).to.be.reverted;
    });

    it('should revert when index is too large (>= 256)', async () => {
      const permit = createSchedulePermit();
      const signature = await createSignature(permit, subscriber);
      const paymentReference = '0x1234567890abcdef';

      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPayment(permit, signature, 256, paymentReference),
      ).to.be.reverted;
    });

    it('should revert when execution is out of order', async () => {
      const permit = createSchedulePermit({ strictOrder: true, periodSeconds: 1 });
      const signature = await createSignature(permit, subscriber);
      const paymentReference = '0x1234567890abcdef';

      // Advance time so payment #2 is due, ensuring the only failure reason is order.
      await ethers.provider.send('evm_increaseTime', [1]);
      await ethers.provider.send('evm_mine', []);

      // Try to execute index 2 before index 1
      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPayment(permit, signature, 2, paymentReference),
      ).to.be.reverted;
    });

    it('should allow out of order trigger if strictOrder is false', async () => {
      const permit = createSchedulePermit({ strictOrder: false, periodSeconds: 1 });
      const signature = await createSignature(permit, subscriber);
      const paymentReference = '0x1234567890abcdef';

      // Fast forward time to make multiple payments due
      await ethers.provider.send('evm_increaseTime', [5]);
      await ethers.provider.send('evm_mine', []);

      // Execute index 2 before index 1, which should be allowed
      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPayment(permit, signature, 2, paymentReference),
      ).to.not.be.reverted;
    });

    it('should revert when index is out of bounds', async () => {
      const permit = createSchedulePermit({ totalPayments: 1 });
      const signature = await createSignature(permit, subscriber);
      const paymentReference = '0x1234567890abcdef';

      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPayment(permit, signature, 2, paymentReference),
      ).to.be.reverted;
    });

    it('should revert when payment is not due yet', async () => {
      const permit = createSchedulePermit({
        firstPayment: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      });
      const signature = await createSignature(permit, subscriber);
      const paymentReference = '0x1234567890abcdef';

      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPayment(permit, signature, 1, paymentReference),
      ).to.be.reverted;
    });

    it('should revert when payment is already triggered', async () => {
      const permit = createSchedulePermit();
      const signature = await createSignature(permit, subscriber);
      const paymentReference = '0x1234567890abcdef';

      // Trigger first time
      await erc20RecurringPaymentProxy
        .connect(relayer)
        .triggerRecurringPayment(permit, signature, 1, paymentReference);

      // Try to trigger the same index again
      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPayment(permit, signature, 1, paymentReference),
      ).to.be.reverted;
    });

    it('should allow sequential trigger of multiple payments', async () => {
      const permit = createSchedulePermit({ totalPayments: 3, periodSeconds: 1 });
      const signature = await createSignature(permit, subscriber);
      const paymentReference = '0x1234567890abcdef';

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
      // Note: We can't directly call _hashSchedule as it's private, but we can verify through the bitmap
      // The bitmap should have bits 1, 2, and 3 set (2^1 + 2^2 + 2^3 = 14)
      // We'll check this by trying to trigger the same indices again, which should fail
      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPayment(permit, signature, 1, paymentReference),
      ).to.be.reverted; // Should fail because already triggered

      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPayment(permit, signature, 2, paymentReference),
      ).to.be.reverted; // Should fail because already triggered

      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPayment(permit, signature, 3, paymentReference),
      ).to.be.reverted; // Should fail because already triggered
    });

    it('should handle zero relayer fee correctly', async () => {
      const permit = createSchedulePermit({ relayerFee: 0 });
      const signature = await createSignature(permit, subscriber);
      const paymentReference = '0x1234567890abcdef';

      const relayerBalanceBefore = await testERC20.balanceOf(relayerAddress);

      await erc20RecurringPaymentProxy
        .connect(relayer)
        .triggerRecurringPayment(permit, signature, 1, paymentReference);

      const relayerBalanceAfter = await testERC20.balanceOf(relayerAddress);
      expect(relayerBalanceAfter).to.equal(relayerBalanceBefore); // No relayer fee transferred
    });

    it('should handle zero fee amount correctly', async () => {
      const permit = createSchedulePermit({ feeAmount: 0 });
      const signature = await createSignature(permit, subscriber);
      const paymentReference = '0x1234567890abcdef';

      const feeAddressBalanceBefore = await testERC20.balanceOf(feeAddressString);

      await erc20RecurringPaymentProxy
        .connect(relayer)
        .triggerRecurringPayment(permit, signature, 1, paymentReference);

      const feeAddressBalanceAfter = await testERC20.balanceOf(feeAddressString);
      expect(feeAddressBalanceAfter).to.equal(feeAddressBalanceBefore); // No fee transferred
    });

    it('should revert when subscriber has insufficient balance', async () => {
      const permit = createSchedulePermit({ amount: 1000 }); // More than subscriber has
      const signature = await createSignature(permit, subscriber);
      const paymentReference = '0x1234567890abcdef';

      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPayment(permit, signature, 1, paymentReference),
      ).to.be.reverted;
    });

    it('should revert when subscriber has insufficient allowance', async () => {
      const permit = createSchedulePermit();
      const signature = await createSignature(permit, subscriber);
      const paymentReference = '0x1234567890abcdef';

      // Revoke approval
      await testERC20.connect(subscriber).approve(erc20RecurringPaymentProxy.address, 0);

      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPayment(permit, signature, 1, paymentReference),
      ).to.be.reverted;
    });
  });

  describe('Integration: Paused state affects execution', () => {
    it('should revert trigger when contract is paused', async () => {
      await erc20RecurringPaymentProxy.pause();

      // Create a minimal SchedulePermit for testing
      const schedulePermit = {
        subscriber: userAddress,
        token: testERC20.address,
        recipient: userAddress,
        feeAddress: userAddress,
        amount: 100,
        feeAmount: 10,
        relayerFee: 5,
        periodSeconds: 3600,
        firstPayment: Math.floor(Date.now() / 1000),
        totalPayments: 1,
        nonce: 0,
        deadline: Math.floor(Date.now() / 1000) + 3600,
      };

      const signature = '0x' + '0'.repeat(130); // Dummy signature
      const paymentReference = '0x1234';

      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPayment(schedulePermit, signature, 1, paymentReference),
      ).to.be.revertedWith('Pausable: paused');
    });
  });
});
