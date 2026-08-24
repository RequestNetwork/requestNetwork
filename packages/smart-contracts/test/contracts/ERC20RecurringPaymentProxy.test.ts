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

  const schedulePermitTypes = {
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

  const schedulePermitBatchTypes = {
    SchedulePermitBatch: [
      { name: 'subscriber', type: 'address' },
      { name: 'token', type: 'address' },
      { name: 'relayerFee', type: 'uint128' },
      { name: 'totalPayments', type: 'uint8' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'strictOrder', type: 'bool' },
      { name: 'scheduleId', type: 'bytes32' },
      { name: 'dueTimes', type: 'uint32[]' },
      { name: 'initialLegs', type: 'Leg[]' },
      { name: 'recurringLegs', type: 'Leg[]' },
    ],
    Leg: [
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint128' },
      { name: 'paymentReference', type: 'bytes8' },
    ],
  };

  const eip712Domain = async () => ({
    name: 'ERC20RecurringPaymentProxy',
    version: '1',
    chainId: await subscriber.getChainId(),
    verifyingContract: erc20RecurringPaymentProxy.address,
  });

  const hashPermitOffchain = async (permit: any) =>
    ethers.utils._TypedDataEncoder.hash(await eip712Domain(), schedulePermitTypes, permit);

  const hashBatchOffchain = async (permit: any) =>
    ethers.utils._TypedDataEncoder.hash(await eip712Domain(), schedulePermitBatchTypes, permit);

  // Helper function to create EIP712 signature
  const createSignature = async (permit: any, signer: Signer) => {
    const domain = await eip712Domain();

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
        ...schedulePermitTypes,
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
      return await (signer as any)._signTypedData(domain, schedulePermitTypes, permit);
    }
  };

  const createBatchSignature = async (permit: any, signer: Signer) => {
    const domain = await eip712Domain();
    const address = await signer.getAddress();
    const typedDataObject = {
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' },
        ],
        ...schedulePermitBatchTypes,
      },
      primaryType: 'SchedulePermitBatch',
      domain,
      message: permit,
    };
    try {
      return await (signer.provider as any).send('eth_signTypedData', [address, typedDataObject]);
    } catch (_) {
      return await (signer as any)._signTypedData(domain, schedulePermitBatchTypes, permit);
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

  describe('Fee destination and rescue', () => {
    const paymentReference = '0x1234567890abcdef';

    it('reverts when feeAmount is non-zero and feeAddress is zero', async () => {
      await testERC20.transfer(subscriberAddress, 500);
      await testERC20.connect(subscriber).approve(erc20RecurringPaymentProxy.address, 500);

      const permit = createSchedulePermit({ feeAddress: ethers.constants.AddressZero });
      const signature = await createSignature(permit, subscriber);
      const scheduleKey = await erc20RecurringPaymentProxy.scheduleKeyFromPermit(permit);

      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPayment(permit, signature, 1, paymentReference),
      ).to.be.revertedWith('ERC20RecurringPaymentProxy__ZeroAddress');
      expect(await erc20RecurringPaymentProxy.triggeredPaymentsBitmap(scheduleKey)).to.equal(0);
    });

    it('allows the owner to rescue a residual balance', async () => {
      await testERC20.transfer(erc20RecurringPaymentProxy.address, 40);
      const ownerBalanceBefore = await testERC20.balanceOf(ownerAddress);

      await erc20RecurringPaymentProxy.rescueTokens(testERC20.address, ownerAddress, 40);

      expect(await testERC20.balanceOf(erc20RecurringPaymentProxy.address)).to.equal(0);
      expect(await testERC20.balanceOf(ownerAddress)).to.equal(ownerBalanceBefore.add(40));
    });

    it('reverts when a non-owner tries to rescue tokens', async () => {
      await testERC20.transfer(erc20RecurringPaymentProxy.address, 10);

      await expect(
        erc20RecurringPaymentProxy.connect(user).rescueTokens(testERC20.address, userAddress, 10),
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('reverts rescue to the zero address', async () => {
      await testERC20.transfer(erc20RecurringPaymentProxy.address, 10);

      await expect(
        erc20RecurringPaymentProxy.rescueTokens(
          testERC20.address,
          ethers.constants.AddressZero,
          10,
        ),
      ).to.be.revertedWith('ERC20RecurringPaymentProxy__ZeroAddress');
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

  describe('Pull assertions', () => {
    const paymentReference = '0x1234567890abcdef';

    it('reverts an under-funded pull, leaves the bitmap unset, and stays collectable after funding', async () => {
      await testERC20.transfer(subscriberAddress, 50);
      await testERC20.connect(subscriber).approve(erc20RecurringPaymentProxy.address, 500);

      const permit = createSchedulePermit();
      const signature = await createSignature(permit, subscriber);
      const scheduleKey = await erc20RecurringPaymentProxy.scheduleKeyFromPermit(permit);

      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPayment(permit, signature, 1, paymentReference),
      ).to.be.reverted;
      expect(await erc20RecurringPaymentProxy.triggeredPaymentsBitmap(scheduleKey)).to.equal(0);

      await testERC20.transfer(subscriberAddress, 500);
      await erc20RecurringPaymentProxy
        .connect(relayer)
        .triggerRecurringPayment(permit, signature, 1, paymentReference);
      expect(await erc20RecurringPaymentProxy.triggeredPaymentsBitmap(scheduleKey)).to.not.equal(0);
    });

    it('cannot settle an unfunded subscriber from a residual proxy balance', async () => {
      const SilentFailFactory = await ethers.getContractFactory('ERC20SilentFail');
      const silentFail = await SilentFailFactory.deploy(1000);
      await silentFail.deployed();

      await silentFail.transfer(erc20RecurringPaymentProxy.address, 500);

      const permit = createSchedulePermit({ token: silentFail.address });
      const signature = await createSignature(permit, subscriber);
      const scheduleKey = await erc20RecurringPaymentProxy.scheduleKeyFromPermit(permit);

      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPayment(permit, signature, 1, paymentReference),
      ).to.be.revertedWith('ERC20RecurringPaymentProxy__TransferFailed');
      expect(await erc20RecurringPaymentProxy.triggeredPaymentsBitmap(scheduleKey)).to.equal(0);
      expect(await silentFail.balanceOf(erc20RecurringPaymentProxy.address)).to.equal(500);
      expect(await silentFail.balanceOf(recipientAddress)).to.equal(0);
    });

    it('reverts a fee-on-transfer token that under-delivers', async () => {
      const FeeOnTransferFactory = await ethers.getContractFactory('ERC20FeeOnTransfer');
      const feeOnTransfer = await FeeOnTransferFactory.deploy(1000);
      await feeOnTransfer.deployed();

      await feeOnTransfer.transfer(subscriberAddress, 500);
      await feeOnTransfer.connect(subscriber).approve(erc20RecurringPaymentProxy.address, 500);

      const permit = createSchedulePermit({ token: feeOnTransfer.address });
      const signature = await createSignature(permit, subscriber);
      const scheduleKey = await erc20RecurringPaymentProxy.scheduleKeyFromPermit(permit);

      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPayment(permit, signature, 1, paymentReference),
      ).to.be.revertedWith('ERC20RecurringPaymentProxy__ShortPull');
      expect(await erc20RecurringPaymentProxy.triggeredPaymentsBitmap(scheduleKey)).to.equal(0);
    });

    it('reverts when the token returns false without reverting', async () => {
      const SilentFailFactory = await ethers.getContractFactory('ERC20SilentFail');
      const silentFail = await SilentFailFactory.deploy(1000);
      await silentFail.deployed();

      await silentFail.transfer(subscriberAddress, 500);
      // No approve: transferFrom returns false instead of reverting.

      const permit = createSchedulePermit({ token: silentFail.address });
      const signature = await createSignature(permit, subscriber);
      const scheduleKey = await erc20RecurringPaymentProxy.scheduleKeyFromPermit(permit);

      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPayment(permit, signature, 1, paymentReference),
      ).to.be.revertedWith('ERC20RecurringPaymentProxy__TransferFailed');
      expect(await erc20RecurringPaymentProxy.triggeredPaymentsBitmap(scheduleKey)).to.equal(0);
    });

    it('does not mark the cycle paid when the relayer-fee transfer fails', async () => {
      const FailTransferFactory = await ethers.getContractFactory('ERC20FailTransfer');
      const failTransfer = await FailTransferFactory.deploy(1000);
      await failTransfer.deployed();

      await failTransfer.transfer(subscriberAddress, 500);
      await failTransfer.connect(subscriber).approve(erc20RecurringPaymentProxy.address, 500);

      const permit = createSchedulePermit({ token: failTransfer.address });
      const signature = await createSignature(permit, subscriber);
      const scheduleKey = await erc20RecurringPaymentProxy.scheduleKeyFromPermit(permit);

      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPayment(permit, signature, 1, paymentReference),
      ).to.be.revertedWith('ERC20RecurringPaymentProxy__TransferFailed');
      expect(await erc20RecurringPaymentProxy.triggeredPaymentsBitmap(scheduleKey)).to.equal(0);
      expect(await failTransfer.balanceOf(recipientAddress)).to.equal(0);
    });
  });

  describe('Schedule key replay', () => {
    const paymentReference = '0x1234567890abcdef';

    it('re-signing with a new nonce or deadline does not reset paid indices', async () => {
      await testERC20.transfer(subscriberAddress, 500);
      await testERC20.connect(subscriber).approve(erc20RecurringPaymentProxy.address, 500);

      const permit = createSchedulePermit();
      const signature = await createSignature(permit, subscriber);
      await erc20RecurringPaymentProxy
        .connect(relayer)
        .triggerRecurringPayment(permit, signature, 1, paymentReference);

      const resigned = { ...permit, nonce: 1, deadline: permit.deadline + 86400 };
      const resignedSignature = await createSignature(resigned, subscriber);
      const scheduleKey = await erc20RecurringPaymentProxy.scheduleKeyFromPermit(permit);

      expect(await erc20RecurringPaymentProxy.scheduleKeyFromPermit(resigned)).to.equal(
        scheduleKey,
      );
      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPayment(resigned, resignedSignature, 1, paymentReference),
      ).to.be.revertedWith('ERC20RecurringPaymentProxy__AlreadyPaid');
    });

    it('rejects index 0', async () => {
      await testERC20.transfer(subscriberAddress, 500);
      await testERC20.connect(subscriber).approve(erc20RecurringPaymentProxy.address, 500);

      const permit = createSchedulePermit();
      const signature = await createSignature(permit, subscriber);

      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPayment(permit, signature, 0, paymentReference),
      ).to.be.revertedWith('ERC20RecurringPaymentProxy__IndexOutOfBounds');
    });

    it('rejects index 256 before the call is encoded', async () => {
      const permit = createSchedulePermit();
      const signature = await createSignature(permit, subscriber);

      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPayment(permit, signature, 256, paymentReference),
      ).to.be.reverted;
    });

    it('keeps the batch schedule key stable across nonce and deadline re-sign', async () => {
      const permit = {
        subscriber: subscriberAddress,
        token: testERC20.address,
        relayerFee: 1,
        totalPayments: 1,
        nonce: 0,
        deadline: Math.floor(Date.now() / 1000) + 86400,
        strictOrder: false,
        scheduleId: '0x0101010101010101010101010101010101010101010101010101010101010101',
        dueTimes: [Math.floor(Date.now() / 1000)],
        initialLegs: [],
        recurringLegs: [],
      };
      const resigned = { ...permit, nonce: 9, deadline: permit.deadline + 1 };
      expect(await erc20RecurringPaymentProxy.scheduleKeyFromBatch(permit)).to.equal(
        await erc20RecurringPaymentProxy.scheduleKeyFromBatch(resigned),
      );
    });

    it('changes the batch schedule key when signed terms change', async () => {
      const permit = {
        subscriber: subscriberAddress,
        token: testERC20.address,
        relayerFee: 1,
        totalPayments: 1,
        nonce: 0,
        deadline: Math.floor(Date.now() / 1000) + 86400,
        strictOrder: false,
        scheduleId: '0x0101010101010101010101010101010101010101010101010101010101010101',
        dueTimes: [Math.floor(Date.now() / 1000)],
        initialLegs: [],
        recurringLegs: [],
      };
      const key = await erc20RecurringPaymentProxy.scheduleKeyFromBatch(permit);
      expect(
        await erc20RecurringPaymentProxy.scheduleKeyFromBatch({
          ...permit,
          token: ethers.constants.AddressZero,
        }),
      ).to.not.equal(key);
      expect(
        await erc20RecurringPaymentProxy.scheduleKeyFromBatch({ ...permit, strictOrder: true }),
      ).to.not.equal(key);
      expect(
        await erc20RecurringPaymentProxy.scheduleKeyFromBatch({
          ...permit,
          recurringLegs: [
            {
              recipient: recipientAddress,
              amount: 1,
              paymentReference: ethers.utils.hexZeroPad('0x01', 8),
            },
          ],
        }),
      ).to.not.equal(key);
    });

    it('rejects a zero batch scheduleId', async () => {
      const permit = {
        subscriber: subscriberAddress,
        token: testERC20.address,
        relayerFee: 0,
        totalPayments: 1,
        nonce: 0,
        deadline: Math.floor(Date.now() / 1000) + 86400,
        strictOrder: false,
        scheduleId: ethers.constants.HashZero,
        dueTimes: [Math.floor(Date.now() / 1000)],
        initialLegs: [],
        recurringLegs: [],
      };
      await expect(erc20RecurringPaymentProxy.scheduleKeyFromBatch(permit)).to.be.revertedWith(
        'ERC20RecurringPaymentProxy__ZeroScheduleId',
      );
    });
  });

  describe('EIP-1271 signatures', () => {
    const paymentReference = '0x1234567890abcdef';

    it('accepts a valid smart-account signature', async () => {
      const MockERC1271Factory = await ethers.getContractFactory('MockERC1271');
      const mockWallet = await MockERC1271Factory.deploy(subscriberAddress);
      await mockWallet.deployed();

      await testERC20.transfer(mockWallet.address, 500);
      await mockWallet
        .connect(subscriber)
        .approveToken(testERC20.address, erc20RecurringPaymentProxy.address, 500);

      const permit = createSchedulePermit({ subscriber: mockWallet.address });
      const signature = await createSignature(permit, subscriber);

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
    });

    it('rejects a malformed smart-account signature', async () => {
      const MockERC1271Factory = await ethers.getContractFactory('MockERC1271');
      const mockWallet = await MockERC1271Factory.deploy(subscriberAddress);
      await mockWallet.deployed();

      await testERC20.transfer(mockWallet.address, 500);
      await mockWallet
        .connect(subscriber)
        .approveToken(testERC20.address, erc20RecurringPaymentProxy.address, 500);

      const permit = createSchedulePermit({ subscriber: mockWallet.address });
      const signature = '0x' + '11'.repeat(65);

      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPayment(permit, signature, 1, paymentReference),
      ).to.be.reverted;
    });

    it('still accepts an EOA signature through SignatureChecker', async () => {
      await testERC20.transfer(subscriberAddress, 500);
      await testERC20.connect(subscriber).approve(erc20RecurringPaymentProxy.address, 500);

      const permit = createSchedulePermit();
      const signature = await createSignature(permit, subscriber);

      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPayment(permit, signature, 1, paymentReference),
      ).to.emit(erc20FeeProxy, 'TransferWithReferenceAndFee');
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

  describe('triggerRecurringPaymentBatch', () => {
    const ref = (n: number) => ethers.utils.hexZeroPad(ethers.utils.hexlify(n), 8);
    const t0 = Math.floor(Date.UTC(2026, 8, 1) / 1000);
    const oct1 = Math.floor(Date.UTC(2026, 9, 1) / 1000);

    const workedExample = (tokenAddress: string) => ({
      subscriber: subscriberAddress,
      token: tokenAddress,
      relayerFee: 1_000_000,
      totalPayments: 4,
      nonce: 0,
      deadline: Math.floor(Date.UTC(2027, 0, 1) / 1000),
      strictOrder: false,
      scheduleId: '0x0101010101010101010101010101010101010101010101010101010101010101',
      dueTimes: [
        t0,
        oct1,
        Math.floor(Date.UTC(2026, 10, 1) / 1000),
        Math.floor(Date.UTC(2026, 11, 1) / 1000),
      ],
      initialLegs: [
        { recipient: recipientAddress, amount: 30_000_000, paymentReference: ref(0x0a) },
        { recipient: feeAddressString, amount: 3_000_000, paymentReference: ref(0x0b) },
      ],
      recurringLegs: [
        { recipient: recipientAddress, amount: 99_000_000, paymentReference: ref(0x0c) },
        { recipient: feeAddressString, amount: 5_000_000, paymentReference: ref(0x0d) },
        { recipient: userAddress, amount: 4_000_000, paymentReference: ref(0x0e) },
        { recipient: newRelayerAddress, amount: 2_000_000, paymentReference: ref(0x0f) },
      ],
    });

    const warpTo = async (timestamp: number) => {
      await ethers.provider.send('evm_setNextBlockTimestamp', [timestamp]);
      await ethers.provider.send('evm_mine', []);
    };

    it('settles the worked-example initial and first recurring cycles atomically', async () => {
      const TestERC20Factory = await ethers.getContractFactory('TestERC20');
      const token = await TestERC20Factory.deploy(200_000_000);
      await token.deployed();
      await token.transfer(subscriberAddress, 160_000_000);
      await token.connect(subscriber).approve(erc20RecurringPaymentProxy.address, 160_000_000);

      const permit = workedExample(token.address);
      const signature = await createBatchSignature(permit, subscriber);
      const scheduleKey = await erc20RecurringPaymentProxy.scheduleKeyFromBatch(permit);

      await warpTo(t0);
      const subscriberBefore = await token.balanceOf(subscriberAddress);
      const relayerBefore = await token.balanceOf(relayerAddress);
      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPaymentBatch(permit, signature, 1),
      )
        .to.emit(erc20FeeProxy, 'TransferWithReferenceAndFee')
        .withArgs(
          token.address,
          recipientAddress,
          30_000_000,
          ethers.utils.keccak256(ref(0x0a)),
          0,
          ethers.constants.AddressZero,
        )
        .and.to.emit(erc20FeeProxy, 'TransferWithReferenceAndFee')
        .withArgs(
          token.address,
          feeAddressString,
          3_000_000,
          ethers.utils.keccak256(ref(0x0b)),
          0,
          ethers.constants.AddressZero,
        );

      expect(await token.balanceOf(subscriberAddress)).to.equal(subscriberBefore.sub(34_000_000));
      expect(await token.balanceOf(recipientAddress)).to.equal(30_000_000);
      expect(await token.balanceOf(feeAddressString)).to.equal(3_000_000);
      expect(await token.balanceOf(relayerAddress)).to.equal(relayerBefore.add(1_000_000));
      expect(await erc20RecurringPaymentProxy.triggeredPaymentsBitmap(scheduleKey)).to.equal(2);

      await warpTo(oct1);
      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPaymentBatch(permit, signature, 2),
      )
        .to.emit(erc20FeeProxy, 'TransferWithReferenceAndFee')
        .withArgs(
          token.address,
          recipientAddress,
          99_000_000,
          ethers.utils.keccak256(ref(0x0c)),
          0,
          ethers.constants.AddressZero,
        );

      expect(await token.balanceOf(subscriberAddress)).to.equal(
        subscriberBefore.sub(34_000_000 + 111_000_000),
      );
      expect(await token.balanceOf(recipientAddress)).to.equal(129_000_000);
    });

    it('still collects a pre-existing single-fee permit on the same instance', async () => {
      await testERC20.transfer(subscriberAddress, 500);
      await testERC20.connect(subscriber).approve(erc20RecurringPaymentProxy.address, 500);

      const now = (await ethers.provider.getBlock('latest')).timestamp;
      const permit = createSchedulePermit({ firstPayment: now, deadline: now + 86400 });
      const signature = await createSignature(permit, subscriber);

      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPayment(permit, signature, 1, '0x1234567890abcdef'),
      ).to.emit(erc20FeeProxy, 'TransferWithReferenceAndFee');
    });

    it('reverts a zero token without moving balances', async () => {
      await testERC20.transfer(subscriberAddress, 500);
      await testERC20.connect(subscriber).approve(erc20RecurringPaymentProxy.address, 500);

      const permit = workedExample(ethers.constants.AddressZero);
      const signature = await createBatchSignature(permit, subscriber);
      const scheduleKey = await erc20RecurringPaymentProxy.scheduleKeyFromBatch(permit);
      const subscriberBefore = await testERC20.balanceOf(subscriberAddress);

      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPaymentBatch(permit, signature, 1),
      ).to.be.revertedWith('ERC20RecurringPaymentProxy__ZeroAddress');
      expect(await erc20RecurringPaymentProxy.triggeredPaymentsBitmap(scheduleKey)).to.equal(0);
      expect(await testERC20.balanceOf(subscriberAddress)).to.equal(subscriberBefore);
    });

    it('reverts when index is greater than totalPayments', async () => {
      const permit = workedExample(testERC20.address);
      const signature = await createBatchSignature(permit, subscriber);

      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPaymentBatch(permit, signature, permit.totalPayments + 1),
      ).to.be.revertedWith('ERC20RecurringPaymentProxy__IndexOutOfBounds');
    });

    it('reverts when dueTimes are not strictly increasing', async () => {
      const permit = workedExample(testERC20.address);
      const decreasing = {
        ...permit,
        dueTimes: [permit.dueTimes[1], permit.dueTimes[0], permit.dueTimes[2], permit.dueTimes[3]],
      };
      const equal = {
        ...permit,
        dueTimes: [permit.dueTimes[0], permit.dueTimes[0], permit.dueTimes[2], permit.dueTimes[3]],
      };

      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPaymentBatch(
            decreasing,
            await createBatchSignature(decreasing, subscriber),
            1,
          ),
      ).to.be.revertedWith('ERC20RecurringPaymentProxy__InvalidDueTimes');
      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPaymentBatch(equal, await createBatchSignature(equal, subscriber), 1),
      ).to.be.revertedWith('ERC20RecurringPaymentProxy__InvalidDueTimes');
    });

    it('rejects index 256 before the call is encoded', async () => {
      const permit = workedExample(testERC20.address);
      const signature = await createBatchSignature(permit, subscriber);

      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPaymentBatch(permit, signature, 256),
      ).to.be.reverted;
    });

    it('reverts a zero subscriber without moving balances', async () => {
      await testERC20.transfer(subscriberAddress, 500);
      await testERC20.connect(subscriber).approve(erc20RecurringPaymentProxy.address, 500);

      const permit = {
        ...workedExample(testERC20.address),
        subscriber: ethers.constants.AddressZero,
      };
      const signature = await createBatchSignature(permit, subscriber);
      const scheduleKey = await erc20RecurringPaymentProxy.scheduleKeyFromBatch(permit);
      const subscriberBefore = await testERC20.balanceOf(subscriberAddress);

      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPaymentBatch(permit, signature, 1),
      ).to.be.revertedWith('ERC20RecurringPaymentProxy__ZeroAddress');
      expect(await erc20RecurringPaymentProxy.triggeredPaymentsBitmap(scheduleKey)).to.equal(0);
      expect(await testERC20.balanceOf(subscriberAddress)).to.equal(subscriberBefore);
    });

    const failingLegPermit = (
      tokenAddress: string,
      first: string,
      middle: string,
      last: string,
    ) => ({
      subscriber: subscriberAddress,
      token: tokenAddress,
      relayerFee: 0,
      totalPayments: 1,
      nonce: 0,
      deadline: Math.floor(Date.now() / 1000) + 86400,
      strictOrder: false,
      scheduleId: '0x0202020202020202020202020202020202020202020202020202020202020202',
      dueTimes: [Math.floor(Date.now() / 1000) - 1],
      initialLegs: [],
      recurringLegs: [
        { recipient: first, amount: 10, paymentReference: ref(0x11) },
        { recipient: middle, amount: 10, paymentReference: ref(0x12) },
        { recipient: last, amount: 10, paymentReference: ref(0x13) },
      ],
    });

    const expectFailedLegUnchanged = async (
      blockedRecipient: string,
      first: string,
      middle: string,
      last: string,
    ) => {
      const BlockFactory = await ethers.getContractFactory('ERC20BlockRecipient');
      const token = await BlockFactory.deploy(1000);
      await token.deployed();
      await token.setBlocked(blockedRecipient);
      await token.transfer(subscriberAddress, 500);
      await token.connect(subscriber).approve(erc20RecurringPaymentProxy.address, 500);

      const permit = failingLegPermit(token.address, first, middle, last);
      const signature = await createBatchSignature(permit, subscriber);
      const scheduleKey = await erc20RecurringPaymentProxy.scheduleKeyFromBatch(permit);
      const subscriberBefore = await token.balanceOf(subscriberAddress);

      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPaymentBatch(permit, signature, 1),
      ).to.be.reverted;
      expect(await erc20RecurringPaymentProxy.triggeredPaymentsBitmap(scheduleKey)).to.equal(0);
      expect(await token.balanceOf(subscriberAddress)).to.equal(subscriberBefore);
      expect(await token.balanceOf(first)).to.equal(0);
      expect(await token.balanceOf(middle)).to.equal(0);
      expect(await token.balanceOf(last)).to.equal(0);
    };

    it('reverts a failing first leg with balances and bitmap unchanged', async () => {
      await expectFailedLegUnchanged(
        recipientAddress,
        recipientAddress,
        userAddress,
        feeAddressString,
      );
    });

    it('reverts a failing middle leg with balances and bitmap unchanged', async () => {
      await expectFailedLegUnchanged(userAddress, recipientAddress, userAddress, feeAddressString);
    });

    it('reverts a failing last leg with balances and bitmap unchanged', async () => {
      await expectFailedLegUnchanged(
        feeAddressString,
        recipientAddress,
        userAddress,
        feeAddressString,
      );
    });

    it('reverts a zero-amount leg without emitting a fee-proxy transfer', async () => {
      const now = (await ethers.provider.getBlock('latest')).timestamp;
      const permit = {
        ...workedExample(testERC20.address),
        deadline: now + 86400,
        dueTimes: [now - 1, now + 86400, now + 2 * 86400, now + 3 * 86400],
        initialLegs: [
          { recipient: recipientAddress, amount: 30_000_000, paymentReference: ref(0x0a) },
          { recipient: feeAddressString, amount: 0, paymentReference: ref(0x0b) },
        ],
      };
      const signature = await createBatchSignature(permit, subscriber);
      const scheduleKey = await erc20RecurringPaymentProxy.scheduleKeyFromBatch(permit);
      const subscriberBefore = await testERC20.balanceOf(subscriberAddress);
      const recipientBefore = await testERC20.balanceOf(recipientAddress);
      const feeBefore = await testERC20.balanceOf(feeAddressString);

      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPaymentBatch(permit, signature, 1),
      ).to.be.revertedWith('ERC20RecurringPaymentProxy__ZeroAmount');

      expect(await erc20RecurringPaymentProxy.triggeredPaymentsBitmap(scheduleKey)).to.equal(0);
      expect(await testERC20.balanceOf(subscriberAddress)).to.equal(subscriberBefore);
      expect(await testERC20.balanceOf(recipientAddress)).to.equal(recipientBefore);
      expect(await testERC20.balanceOf(feeAddressString)).to.equal(feeBefore);
    });
  });

  describe('cancelSchedule', () => {
    const paymentReference = '0x1234567890abcdef';
    const ref = (n: number) => ethers.utils.hexZeroPad(ethers.utils.hexlify(n), 8);

    const latestTs = async () => (await ethers.provider.getBlock('latest')).timestamp;

    const simpleBatch = async () => {
      const now = await latestTs();
      return {
        subscriber: subscriberAddress,
        token: testERC20.address,
        relayerFee: 0,
        totalPayments: 1,
        nonce: 0,
        deadline: now + 86400,
        strictOrder: false,
        scheduleId: '0x0303030303030303030303030303030303030303030303030303030303030303',
        dueTimes: [now],
        initialLegs: [],
        recurringLegs: [{ recipient: recipientAddress, amount: 10, paymentReference: ref(0x21) }],
      };
    };

    it('blocks the single-fee entry point after the subscriber cancels', async () => {
      await testERC20.transfer(subscriberAddress, 500);
      await testERC20.connect(subscriber).approve(erc20RecurringPaymentProxy.address, 500);

      const now = await latestTs();
      const permit = createSchedulePermit({ firstPayment: now, deadline: now + 86400 });
      const signature = await createSignature(permit, subscriber);

      await erc20RecurringPaymentProxy.connect(subscriber).cancelSchedule(permit);

      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPayment(permit, signature, 1, paymentReference),
      ).to.be.revertedWith('ERC20RecurringPaymentProxy__Cancelled');
    });

    it('blocks the batch entry point after the subscriber cancels', async () => {
      await testERC20.transfer(subscriberAddress, 500);
      await testERC20.connect(subscriber).approve(erc20RecurringPaymentProxy.address, 500);

      const permit = await simpleBatch();
      const signature = await createBatchSignature(permit, subscriber);
      await erc20RecurringPaymentProxy.connect(subscriber).cancelScheduleBatch(permit);

      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPaymentBatch(permit, signature, 1),
      ).to.be.revertedWith('ERC20RecurringPaymentProxy__Cancelled');
    });

    it('keeps a cancelled single-fee schedule cancelled after a deadline re-sign', async () => {
      const now = await latestTs();
      const permit = createSchedulePermit({ firstPayment: now, deadline: now + 86400 });
      await erc20RecurringPaymentProxy.connect(subscriber).cancelSchedule(permit);

      const resigned = { ...permit, deadline: now + 86400 * 30 };
      const signature = await createSignature(resigned, subscriber);
      await testERC20.transfer(subscriberAddress, 500);
      await testERC20.connect(subscriber).approve(erc20RecurringPaymentProxy.address, 500);

      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPayment(resigned, signature, 1, paymentReference),
      ).to.be.revertedWith('ERC20RecurringPaymentProxy__Cancelled');
    });

    it('reverts when a non-subscriber tries to cancel', async () => {
      const permit = createSchedulePermit();
      await expect(
        erc20RecurringPaymentProxy.connect(relayer).cancelSchedule(permit),
      ).to.be.revertedWith('ERC20RecurringPaymentProxy__NotSubscriber');
      await expect(
        erc20RecurringPaymentProxy.connect(user).cancelScheduleBatch(await simpleBatch()),
      ).to.be.revertedWith('ERC20RecurringPaymentProxy__NotSubscriber');
    });

    it("reverts when another subscriber tries to cancel someone else's schedule", async () => {
      const permit = createSchedulePermit();
      const hijack = { ...permit, subscriber: userAddress };
      await expect(erc20RecurringPaymentProxy.connect(user).cancelSchedule(hijack)).to.not.be
        .reverted;
      expect(
        await erc20RecurringPaymentProxy.cancelledSchedules(
          await erc20RecurringPaymentProxy.scheduleKeyFromPermit(permit),
        ),
      ).to.equal(false);
    });
  });

  describe('admitCycles', () => {
    const ref = (n: number) => ethers.utils.hexZeroPad(ethers.utils.hexlify(n), 32);
    const latestTs = async () => (await ethers.provider.getBlock('latest')).timestamp;
    const bit = (index: number) => ethers.BigNumber.from(1).shl(index);

    const batchPermit = async (overrides: Record<string, unknown> = {}) => {
      const now = await latestTs();
      return {
        subscriber: subscriberAddress,
        token: testERC20.address,
        relayerFee: 0,
        totalPayments: 4,
        nonce: 0,
        deadline: now + 86400,
        strictOrder: false,
        scheduleId: '0x0404040404040404040404040404040404040404040404040404040404040404',
        dueTimes: [now - 3, now - 2, now - 1, now],
        initialLegs: [],
        recurringLegs: [{ recipient: recipientAddress, amount: 10, paymentReference: ref(0x31) }],
        ...overrides,
      };
    };

    const fundSubscriber = async () => {
      await testERC20.transfer(subscriberAddress, 500);
      await testERC20.connect(subscriber).approve(erc20RecurringPaymentProxy.address, 500);
    };

    it('rejects a subscriber-initiated call when the cycle was never admitted', async () => {
      await fundSubscriber();
      const permit = await batchPermit();
      const signature = await createBatchSignature(permit, subscriber);

      await expect(
        erc20RecurringPaymentProxy
          .connect(subscriber)
          .triggerRecurringPaymentBatch(permit, signature, 1),
      ).to.be.revertedWith('ERC20RecurringPaymentProxy__NotAdmitted');
    });

    it('does not let admitting index 3 admit index 4', async () => {
      await fundSubscriber();
      const permit = await batchPermit();
      const signature = await createBatchSignature(permit, subscriber);
      const scheduleKey = await erc20RecurringPaymentProxy.scheduleKeyFromBatch(permit);

      await erc20RecurringPaymentProxy.connect(relayer).admitCycles(scheduleKey, bit(3));

      await expect(
        erc20RecurringPaymentProxy
          .connect(subscriber)
          .triggerRecurringPaymentBatch(permit, signature, 4),
      ).to.be.revertedWith('ERC20RecurringPaymentProxy__NotAdmitted');

      await expect(
        erc20RecurringPaymentProxy
          .connect(subscriber)
          .triggerRecurringPaymentBatch(permit, signature, 3),
      ).to.emit(erc20FeeProxy, 'TransferWithReferenceAndFee');
    });

    it('lets the relayer trigger a cycle that was never admitted', async () => {
      await fundSubscriber();
      const permit = await batchPermit();
      const signature = await createBatchSignature(permit, subscriber);

      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPaymentBatch(permit, signature, 1),
      ).to.emit(erc20FeeProxy, 'TransferWithReferenceAndFee');
    });

    it("reverts when a subscriber tries to trigger another subscriber's admitted schedule", async () => {
      await fundSubscriber();
      const permit = await batchPermit();
      const signature = await createBatchSignature(permit, subscriber);
      const scheduleKey = await erc20RecurringPaymentProxy.scheduleKeyFromBatch(permit);
      await erc20RecurringPaymentProxy.connect(relayer).admitCycles(scheduleKey, bit(1));

      await expect(
        erc20RecurringPaymentProxy.connect(user).triggerRecurringPaymentBatch(permit, signature, 1),
      ).to.be.revertedWith('ERC20RecurringPaymentProxy__NotSubscriber');
    });

    it('still enforces NotDueYet on the self-trigger path', async () => {
      await fundSubscriber();
      const now = await latestTs();
      const permit = await batchPermit({
        dueTimes: [now + 3600, now + 7200, now + 10800, now + 14400],
      });
      const signature = await createBatchSignature(permit, subscriber);
      const scheduleKey = await erc20RecurringPaymentProxy.scheduleKeyFromBatch(permit);
      await erc20RecurringPaymentProxy.connect(relayer).admitCycles(scheduleKey, bit(1));

      await expect(
        erc20RecurringPaymentProxy
          .connect(subscriber)
          .triggerRecurringPaymentBatch(permit, signature, 1),
      ).to.be.revertedWith('ERC20RecurringPaymentProxy__NotDueYet');
    });

    it('still enforces pause on the self-trigger path', async () => {
      await fundSubscriber();
      const permit = await batchPermit();
      const signature = await createBatchSignature(permit, subscriber);
      const scheduleKey = await erc20RecurringPaymentProxy.scheduleKeyFromBatch(permit);
      await erc20RecurringPaymentProxy.connect(relayer).admitCycles(scheduleKey, bit(1));
      await erc20RecurringPaymentProxy.pause();

      await expect(
        erc20RecurringPaymentProxy
          .connect(subscriber)
          .triggerRecurringPaymentBatch(permit, signature, 1),
      ).to.be.revertedWith('Pausable: paused');
    });

    it('keeps the single-fee entry point relayer-only', async () => {
      const now = await latestTs();
      const permit = createSchedulePermit({ firstPayment: now, deadline: now + 86400 });
      const signature = await createSignature(permit, subscriber);
      const scheduleKey = await erc20RecurringPaymentProxy.scheduleKeyFromPermit(permit);
      await erc20RecurringPaymentProxy.connect(relayer).admitCycles(scheduleKey, bit(1));

      await expect(
        erc20RecurringPaymentProxy
          .connect(subscriber)
          .triggerRecurringPayment(permit, signature, 1, '0x1234567890abcdef'),
      ).to.be.revertedWith('AccessControl: account');
    });

    it('reverts when a non-relayer tries to admit cycles', async () => {
      const permit = await batchPermit();
      const scheduleKey = await erc20RecurringPaymentProxy.scheduleKeyFromBatch(permit);
      await expect(
        erc20RecurringPaymentProxy.connect(subscriber).admitCycles(scheduleKey, bit(1)),
      ).to.be.revertedWith('AccessControl: account');
    });
  });

  describe('revokeCycles', () => {
    const ref = (n: number) => ethers.utils.hexZeroPad(ethers.utils.hexlify(n), 32);
    const latestTs = async () => (await ethers.provider.getBlock('latest')).timestamp;
    const bit = (index: number) => ethers.BigNumber.from(1).shl(index);

    const batchPermit = async (overrides: Record<string, unknown> = {}) => {
      const now = await latestTs();
      return {
        subscriber: subscriberAddress,
        token: testERC20.address,
        relayerFee: 0,
        totalPayments: 4,
        nonce: 0,
        deadline: now + 86400,
        strictOrder: false,
        scheduleId: '0x0505050505050505050505050505050505050505050505050505050505050505',
        dueTimes: [now - 3, now - 2, now - 1, now],
        initialLegs: [],
        recurringLegs: [{ recipient: recipientAddress, amount: 10, paymentReference: ref(0x32) }],
        ...overrides,
      };
    };

    const fundSubscriber = async () => {
      await testERC20.transfer(subscriberAddress, 500);
      await testERC20.connect(subscriber).approve(erc20RecurringPaymentProxy.address, 500);
    };

    it('blocks a subscriber self-trigger after the admitted bit is revoked', async () => {
      await fundSubscriber();
      const permit = await batchPermit();
      const signature = await createBatchSignature(permit, subscriber);
      const scheduleKey = await erc20RecurringPaymentProxy.scheduleKeyFromBatch(permit);

      await erc20RecurringPaymentProxy.connect(relayer).admitCycles(scheduleKey, bit(3));
      await erc20RecurringPaymentProxy.connect(relayer).revokeCycles(scheduleKey, bit(3));

      await expect(
        erc20RecurringPaymentProxy
          .connect(subscriber)
          .triggerRecurringPaymentBatch(permit, signature, 3),
      ).to.be.revertedWith('ERC20RecurringPaymentProxy__NotAdmitted');
    });

    it('lets the relayer trigger a cycle after its admitted bit is revoked', async () => {
      await fundSubscriber();
      const permit = await batchPermit();
      const signature = await createBatchSignature(permit, subscriber);
      const scheduleKey = await erc20RecurringPaymentProxy.scheduleKeyFromBatch(permit);

      await erc20RecurringPaymentProxy.connect(relayer).admitCycles(scheduleKey, bit(3));
      await erc20RecurringPaymentProxy.connect(relayer).revokeCycles(scheduleKey, bit(3));

      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPaymentBatch(permit, signature, 3),
      ).to.emit(erc20FeeProxy, 'TransferWithReferenceAndFee');
    });

    it('reverts when a non-relayer tries to revoke cycles', async () => {
      const permit = await batchPermit();
      const scheduleKey = await erc20RecurringPaymentProxy.scheduleKeyFromBatch(permit);
      await erc20RecurringPaymentProxy.connect(relayer).admitCycles(scheduleKey, bit(1));
      await expect(
        erc20RecurringPaymentProxy.connect(subscriber).revokeCycles(scheduleKey, bit(1)),
      ).to.be.revertedWith('AccessControl: account');
    });
  });

  describe('EIP-712 digest parity', () => {
    const ref = (n: number) => ethers.utils.hexZeroPad(ethers.utils.hexlify(n), 8);

    const workedExample = () => {
      const t0 = Math.floor(Date.UTC(2026, 8, 1) / 1000);
      const oct1 = Math.floor(Date.UTC(2026, 9, 1) / 1000);
      const nov1 = Math.floor(Date.UTC(2026, 10, 1) / 1000);
      const dec1 = Math.floor(Date.UTC(2026, 11, 1) / 1000);
      return {
        subscriber: subscriberAddress,
        token: testERC20.address,
        relayerFee: 1_000_000,
        totalPayments: 4,
        nonce: 0,
        deadline: Math.floor(Date.UTC(2027, 0, 1) / 1000),
        strictOrder: false,
        scheduleId: '0x0101010101010101010101010101010101010101010101010101010101010101',
        dueTimes: [t0, oct1, nov1, dec1],
        initialLegs: [
          { recipient: recipientAddress, amount: 30_000_000, paymentReference: ref(0x0a) },
          { recipient: feeAddressString, amount: 3_000_000, paymentReference: ref(0x0b) },
        ],
        recurringLegs: [
          { recipient: recipientAddress, amount: 99_000_000, paymentReference: ref(0x0c) },
          { recipient: feeAddressString, amount: 5_000_000, paymentReference: ref(0x0d) },
          { recipient: userAddress, amount: 4_000_000, paymentReference: ref(0x0e) },
          { recipient: newRelayerAddress, amount: 2_000_000, paymentReference: ref(0x0f) },
        ],
      };
    };

    it('matches ethers _TypedDataEncoder for SchedulePermit', async () => {
      const permit = createSchedulePermit();
      expect(await erc20RecurringPaymentProxy.hashSchedule(permit)).to.equal(
        await hashPermitOffchain(permit),
      );
    });

    it('matches ethers _TypedDataEncoder for the worked-example SchedulePermitBatch', async () => {
      const permit = workedExample();
      expect(await erc20RecurringPaymentProxy.hashScheduleBatch(permit)).to.equal(
        await hashBatchOffchain(permit),
      );
    });

    it('matches ethers _TypedDataEncoder when initialLegs is empty', async () => {
      const permit = { ...workedExample(), initialLegs: [] };
      expect(await erc20RecurringPaymentProxy.hashScheduleBatch(permit)).to.equal(
        await hashBatchOffchain(permit),
      );
    });

    it('createBatchSignature is a valid typed-data payload for the worked example', async () => {
      const permit = workedExample();
      const signature = await createBatchSignature(permit, subscriber);
      expect(signature).to.match(/^0x[0-9a-fA-F]{130}$/);
    });

    it('uses an 8-byte payment reference whose fee-proxy topic is not the 32-byte pad', () => {
      const ref8 = ref(0x0a);
      const ref32 = ethers.utils.hexZeroPad(ref8, 32);
      expect(ref8).to.equal('0x000000000000000a');
      expect(ethers.utils.keccak256(ref8)).to.equal(ethers.utils.keccak256('0x000000000000000a'));
      expect(ethers.utils.keccak256(ref8)).to.not.equal(ethers.utils.keccak256(ref32));
    });
  });
});
