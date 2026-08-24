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

  const hashBatchOffchain = async (permit: any) =>
    ethers.utils._TypedDataEncoder.hash(await eip712Domain(), schedulePermitBatchTypes, permit);

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

  describe('grantRelayer and revokeRelayer', () => {
    it('grants RELAYER_ROLE to a new address', async () => {
      await erc20RecurringPaymentProxy.grantRelayer(newRelayerAddress);

      expect(
        await erc20RecurringPaymentProxy.hasRole(
          await erc20RecurringPaymentProxy.RELAYER_ROLE(),
          relayerAddress,
        ),
      ).to.be.true;
      expect(
        await erc20RecurringPaymentProxy.hasRole(
          await erc20RecurringPaymentProxy.RELAYER_ROLE(),
          newRelayerAddress,
        ),
      ).to.be.true;
    });

    it('revokes RELAYER_ROLE from a current relayer', async () => {
      await erc20RecurringPaymentProxy.revokeRelayer(relayerAddress);

      expect(
        await erc20RecurringPaymentProxy.hasRole(
          await erc20RecurringPaymentProxy.RELAYER_ROLE(),
          relayerAddress,
        ),
      ).to.be.false;
    });

    it('reverts when a non-admin tries to grant or revoke', async () => {
      await expect(
        erc20RecurringPaymentProxy.connect(user).grantRelayer(newRelayerAddress),
      ).to.be.revertedWith('AccessControl: account');
      await expect(
        erc20RecurringPaymentProxy.connect(user).revokeRelayer(relayerAddress),
      ).to.be.revertedWith('AccessControl: account');
    });

    it('emits RoleGranted and RoleRevoked', async () => {
      await expect(erc20RecurringPaymentProxy.grantRelayer(newRelayerAddress))
        .to.emit(erc20RecurringPaymentProxy, 'RoleGranted')
        .withArgs(await erc20RecurringPaymentProxy.RELAYER_ROLE(), newRelayerAddress, ownerAddress);

      await expect(erc20RecurringPaymentProxy.revokeRelayer(relayerAddress))
        .to.emit(erc20RecurringPaymentProxy, 'RoleRevoked')
        .withArgs(await erc20RecurringPaymentProxy.RELAYER_ROLE(), relayerAddress, ownerAddress);
    });

    it('reverts grant of the zero address', async () => {
      await expect(
        erc20RecurringPaymentProxy.grantRelayer(ethers.constants.AddressZero),
      ).to.be.revertedWith('ERC20RecurringPaymentProxy__ZeroAddress');
    });

    it('reverts revoke when the address does not hold RELAYER_ROLE and leaves holders unchanged', async () => {
      const relayerRole = await erc20RecurringPaymentProxy.RELAYER_ROLE();

      await expect(erc20RecurringPaymentProxy.revokeRelayer(userAddress)).to.be.revertedWith(
        'ERC20RecurringPaymentProxy__NotRelayer',
      );

      expect(await erc20RecurringPaymentProxy.hasRole(relayerRole, relayerAddress)).to.be.true;
      expect(await erc20RecurringPaymentProxy.hasRole(relayerRole, userAddress)).to.be.false;
    });
  });

  describe('setFeeProxy', () => {
    it('should allow owner to set new fee proxy', async () => {
      const newERC20FeeProxy = await (await ethers.getContractFactory('ERC20FeeProxy')).deploy();
      await newERC20FeeProxy.deployed();

      await expect(erc20RecurringPaymentProxy.setFeeProxy(newERC20FeeProxy.address))
        .to.emit(erc20RecurringPaymentProxy, 'FeeProxyUpdated')
        .withArgs(erc20FeeProxy.address, newERC20FeeProxy.address);
      expect(await erc20RecurringPaymentProxy.erc20FeeProxy()).to.equal(newERC20FeeProxy.address);
    });

    it('should revert when non-owner tries to set fee proxy', async () => {
      const newERC20FeeProxy = await (await ethers.getContractFactory('ERC20FeeProxy')).deploy();
      await newERC20FeeProxy.deployed();

      await expect(
        erc20RecurringPaymentProxy.connect(user).setFeeProxy(newERC20FeeProxy.address),
      ).to.be.revertedWith('AccessControl: account');
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
        'AccessControl: account',
      );
    });

    it('should revert when non-owner tries to unpause', async () => {
      await erc20RecurringPaymentProxy.pause();

      await expect(erc20RecurringPaymentProxy.connect(user).unpause()).to.be.revertedWith(
        'AccessControl: account',
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

  describe('Admin role', () => {
    it('lets the admin grant and revoke DEFAULT_ADMIN_ROLE', async () => {
      const adminRole = await erc20RecurringPaymentProxy.DEFAULT_ADMIN_ROLE();
      await erc20RecurringPaymentProxy.grantRole(adminRole, newOwnerAddress);
      expect(await erc20RecurringPaymentProxy.hasRole(adminRole, newOwnerAddress)).to.be.true;

      await erc20RecurringPaymentProxy.connect(newOwner).revokeRole(adminRole, ownerAddress);
      expect(await erc20RecurringPaymentProxy.hasRole(adminRole, ownerAddress)).to.be.false;
    });

    it('reverts when a non-admin tries to grant admin', async () => {
      await expect(
        erc20RecurringPaymentProxy
          .connect(user)
          .grantRole(await erc20RecurringPaymentProxy.DEFAULT_ADMIN_ROLE(), userAddress),
      ).to.be.revertedWith('AccessControl: account');
    });
  });

  describe('Fee destination and rescue', () => {
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
      ).to.be.revertedWith('AccessControl: account');
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

  describe('Schedule key replay', () => {
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
        )
        .and.to.emit(erc20RecurringPaymentProxy, 'PaymentTriggered')
        .withArgs(scheduleKey, subscriberAddress, token.address, 1, 34_000_000);

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

  describe('Pull assertions', () => {
    const ref = (n: number) => ethers.utils.hexZeroPad(ethers.utils.hexlify(n), 8);

    const pullPermit = async (tokenAddress: string, overrides: Record<string, unknown> = {}) => {
      const now = (await ethers.provider.getBlock('latest')).timestamp;
      return {
        subscriber: subscriberAddress,
        token: tokenAddress,
        relayerFee: 5,
        totalPayments: 1,
        nonce: 0,
        deadline: now + 86400,
        strictOrder: false,
        scheduleId: '0x0606060606060606060606060606060606060606060606060606060606060606',
        dueTimes: [now - 1],
        initialLegs: [],
        recurringLegs: [{ recipient: recipientAddress, amount: 100, paymentReference: ref(0x41) }],
        ...overrides,
      };
    };

    it('reverts an under-funded pull, leaves the bitmap unset, and stays collectable after funding', async () => {
      await testERC20.transfer(subscriberAddress, 50);
      await testERC20.connect(subscriber).approve(erc20RecurringPaymentProxy.address, 500);

      const permit = await pullPermit(testERC20.address);
      const signature = await createBatchSignature(permit, subscriber);
      const scheduleKey = await erc20RecurringPaymentProxy.scheduleKeyFromBatch(permit);

      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPaymentBatch(permit, signature, 1),
      ).to.be.reverted;
      expect(await erc20RecurringPaymentProxy.triggeredPaymentsBitmap(scheduleKey)).to.equal(0);

      await testERC20.transfer(subscriberAddress, 500);
      await erc20RecurringPaymentProxy
        .connect(relayer)
        .triggerRecurringPaymentBatch(permit, signature, 1);
      expect(await erc20RecurringPaymentProxy.triggeredPaymentsBitmap(scheduleKey)).to.not.equal(0);
      expect(await testERC20.balanceOf(erc20RecurringPaymentProxy.address)).to.equal(0);
    });

    it('cannot settle an unfunded subscriber from a residual proxy balance', async () => {
      const SilentFailFactory = await ethers.getContractFactory('ERC20SilentFail');
      const silentFail = await SilentFailFactory.deploy(1000);
      await silentFail.deployed();

      await silentFail.transfer(erc20RecurringPaymentProxy.address, 500);

      const permit = await pullPermit(silentFail.address);
      const signature = await createBatchSignature(permit, subscriber);
      const scheduleKey = await erc20RecurringPaymentProxy.scheduleKeyFromBatch(permit);

      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPaymentBatch(permit, signature, 1),
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

      const permit = await pullPermit(feeOnTransfer.address);
      const signature = await createBatchSignature(permit, subscriber);
      const scheduleKey = await erc20RecurringPaymentProxy.scheduleKeyFromBatch(permit);

      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPaymentBatch(permit, signature, 1),
      ).to.be.revertedWith('ERC20RecurringPaymentProxy__ShortPull');
      expect(await erc20RecurringPaymentProxy.triggeredPaymentsBitmap(scheduleKey)).to.equal(0);
    });

    it('reverts when the token returns false without reverting', async () => {
      const SilentFailFactory = await ethers.getContractFactory('ERC20SilentFail');
      const silentFail = await SilentFailFactory.deploy(1000);
      await silentFail.deployed();

      await silentFail.transfer(subscriberAddress, 500);
      // No approve: transferFrom returns false instead of reverting.

      const permit = await pullPermit(silentFail.address);
      const signature = await createBatchSignature(permit, subscriber);
      const scheduleKey = await erc20RecurringPaymentProxy.scheduleKeyFromBatch(permit);

      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPaymentBatch(permit, signature, 1),
      ).to.be.revertedWith('ERC20RecurringPaymentProxy__TransferFailed');
      expect(await erc20RecurringPaymentProxy.triggeredPaymentsBitmap(scheduleKey)).to.equal(0);
    });

    it('does not mark the cycle paid when the relayer-fee transfer fails', async () => {
      const FailTransferFactory = await ethers.getContractFactory('ERC20FailTransfer');
      const failTransfer = await FailTransferFactory.deploy(1000);
      await failTransfer.deployed();

      await failTransfer.transfer(subscriberAddress, 500);
      await failTransfer.connect(subscriber).approve(erc20RecurringPaymentProxy.address, 500);

      const permit = await pullPermit(failTransfer.address);
      const signature = await createBatchSignature(permit, subscriber);
      const scheduleKey = await erc20RecurringPaymentProxy.scheduleKeyFromBatch(permit);

      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPaymentBatch(permit, signature, 1),
      ).to.be.revertedWith('ERC20RecurringPaymentProxy__TransferFailed');
      expect(await erc20RecurringPaymentProxy.triggeredPaymentsBitmap(scheduleKey)).to.equal(0);
      expect(await failTransfer.balanceOf(recipientAddress)).to.equal(0);
    });
  });

  describe('EIP-1271 signatures', () => {
    const ref = (n: number) => ethers.utils.hexZeroPad(ethers.utils.hexlify(n), 8);

    const walletPermit = async (wallet: string) => {
      const now = (await ethers.provider.getBlock('latest')).timestamp;
      return {
        subscriber: wallet,
        token: testERC20.address,
        relayerFee: 5,
        totalPayments: 1,
        nonce: 0,
        deadline: now + 86400,
        strictOrder: false,
        scheduleId: '0x0707070707070707070707070707070707070707070707070707070707070707',
        dueTimes: [now - 1],
        initialLegs: [],
        recurringLegs: [{ recipient: recipientAddress, amount: 100, paymentReference: ref(0x51) }],
      };
    };

    it('accepts a valid smart-account signature', async () => {
      const MockERC1271Factory = await ethers.getContractFactory('MockERC1271');
      const mockWallet = await MockERC1271Factory.deploy(subscriberAddress);
      await mockWallet.deployed();

      await testERC20.transfer(mockWallet.address, 500);
      await mockWallet
        .connect(subscriber)
        .approveToken(testERC20.address, erc20RecurringPaymentProxy.address, 500);

      const permit = await walletPermit(mockWallet.address);
      const signature = await createBatchSignature(permit, subscriber);

      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPaymentBatch(permit, signature, 1),
      )
        .to.emit(erc20FeeProxy, 'TransferWithReferenceAndFee')
        .withArgs(
          testERC20.address,
          recipientAddress,
          100,
          ethers.utils.keccak256(ref(0x51)),
          0,
          ethers.constants.AddressZero,
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

      const permit = await walletPermit(mockWallet.address);
      const signature = '0x' + '11'.repeat(65);

      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPaymentBatch(permit, signature, 1),
      ).to.be.revertedWith('ERC20RecurringPaymentProxy__BadSignature');
    });
  });

  describe('cancelSchedule', () => {
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

    it('blocks the batch entry point after the subscriber cancels', async () => {
      await testERC20.transfer(subscriberAddress, 500);
      await testERC20.connect(subscriber).approve(erc20RecurringPaymentProxy.address, 500);

      const permit = await simpleBatch();
      const signature = await createBatchSignature(permit, subscriber);
      const scheduleKey = await erc20RecurringPaymentProxy.scheduleKeyFromBatch(permit);
      await expect(erc20RecurringPaymentProxy.connect(subscriber).cancelScheduleBatch(permit))
        .to.emit(erc20RecurringPaymentProxy, 'ScheduleCancelled')
        .withArgs(scheduleKey, subscriberAddress);

      await expect(
        erc20RecurringPaymentProxy
          .connect(relayer)
          .triggerRecurringPaymentBatch(permit, signature, 1),
      ).to.be.revertedWith('ERC20RecurringPaymentProxy__Cancelled');
    });

    it('reverts when a non-subscriber tries to cancel', async () => {
      await expect(
        erc20RecurringPaymentProxy.connect(user).cancelScheduleBatch(await simpleBatch()),
      ).to.be.revertedWith('ERC20RecurringPaymentProxy__NotSubscriber');
    });
  });

  describe('admitCycles', () => {
    const ref = (n: number) => ethers.utils.hexZeroPad(ethers.utils.hexlify(n), 8);
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

      await expect(erc20RecurringPaymentProxy.connect(relayer).admitCycles(scheduleKey, bit(3)))
        .to.emit(erc20RecurringPaymentProxy, 'CyclesAdmitted')
        .withArgs(scheduleKey, bit(3));

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

    it('reverts when a non-relayer tries to admit cycles', async () => {
      const permit = await batchPermit();
      const scheduleKey = await erc20RecurringPaymentProxy.scheduleKeyFromBatch(permit);
      await expect(
        erc20RecurringPaymentProxy.connect(subscriber).admitCycles(scheduleKey, bit(1)),
      ).to.be.revertedWith('AccessControl: account');
    });
  });

  describe('revokeCycles', () => {
    const ref = (n: number) => ethers.utils.hexZeroPad(ethers.utils.hexlify(n), 8);
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
      await expect(erc20RecurringPaymentProxy.connect(relayer).revokeCycles(scheduleKey, bit(3)))
        .to.emit(erc20RecurringPaymentProxy, 'CyclesRevoked')
        .withArgs(scheduleKey, bit(3));

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
