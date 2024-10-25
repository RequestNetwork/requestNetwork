import { ethers } from 'hardhat';
import { expect } from 'chai';
import { Signer } from 'ethers';
import { deploySingleRequestProxy } from '../../src/payment/single-request-proxy';
import {
  ClientTypes,
  ExtensionTypes,
  RequestLogicTypes,
  IdentityTypes,
} from '@requestnetwork/types';
import { SingleRequestProxyFactory } from '@requestnetwork/smart-contracts/types';

describe('Single Request Proxy', () => {
  let owner: Signer;
  let payee: Signer;
  let feeRecipient: Signer;
  let singleRequestProxyFactory: SingleRequestProxyFactory;
  let ownerAddress: string;
  let payeeAddress: string;
  let feeRecipientAddress: string;

  beforeEach(async () => {
    [owner, payee, feeRecipient] = await ethers.getSigners();
    ownerAddress = await owner.getAddress();
    payeeAddress = await payee.getAddress();
    feeRecipientAddress = await feeRecipient.getAddress();

    // Deploy SingleRequestProxyFactory
    const SingleRequestProxyFactoryFactory = await ethers.getContractFactory(
      'SingleRequestProxyFactory',
    );
    singleRequestProxyFactory = await SingleRequestProxyFactoryFactory.deploy(
      ethers.constants.AddressZero, // Ethereum Fee Proxy address (not needed for this test)
      ethers.constants.AddressZero, // ERC20 Fee Proxy address (not needed for this test)
      ownerAddress,
    );
    await singleRequestProxyFactory.deployed();
  });

  it('should deploy EthereumSingleRequestProxy', async () => {
    const validRequest: ClientTypes.IRequestData = {
      requestId: 'abcd1234',
      currency: 'ETH',
      currencyInfo: {
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'ETH',
        network: 'private',
      },
      expectedAmount: '1000000000000000000', // 1 ETH
      payee: {
        type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
        value: payeeAddress,
      },
      payer: {
        type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
        value: ownerAddress,
      },
      timestamp: Date.now(),
      extensions: {
        [ExtensionTypes.PAYMENT_NETWORK_ID.ETH_FEE_PROXY_CONTRACT]: {
          id: ExtensionTypes.PAYMENT_NETWORK_ID.ETH_FEE_PROXY_CONTRACT,
          type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
          values: {
            salt: 'salt1234',
            paymentAddress: payeeAddress,
            feeAddress: feeRecipientAddress,
            feeAmount: '10000000000000000', // 0.01 ETH
          },
          version: '0.1.0',
        },
      },
    };

    const proxyAddress = await deploySingleRequestProxy(validRequest, owner);

    expect(proxyAddress).to.be.properAddress;

    // Verify the deployed proxy
    const EthereumSingleRequestProxy = await ethers.getContractFactory(
      'EthereumSingleRequestProxy',
    );
    const deployedProxy = EthereumSingleRequestProxy.attach(proxyAddress);

    expect(await deployedProxy.payee()).to.equal(payeeAddress);
    expect(await deployedProxy.feeAddress()).to.equal(feeRecipientAddress);
    expect(await deployedProxy.feeAmount()).to.equal('10000000000000000');
  });
});
