# @requestnetwork/smart-contracs

`@requestnetwork/smart-contracts` is a package part of the [Request Network protocol](https://github.com/RequestNetwork/requestNetwork).
The package stores the sources and artifacts of the smart contracts deployed on Ethereum. It also exposes a library to get information about the artifacts.

## Installation

```bash
npm install @requestnetwork/smart-contracts
```

You may need some environment variables.
You can create a .env file at the root of this package:

```
DEPLOYMENT_PRIVATE_KEY=...  # Mandatory to deploy on live blockchains (legacy)
ADMIN_PRIVATE_KEY=...       # Mandatory to deploy on live blockchains (xdeployer)
WEB3_PROVIDER_URL=...       # Mandatory to interact with live blockchains
ETHERSCAN_API_KEY=...       # Only used to verify smart contracts code on live blockchains, even for other explorers, except:
BSCSCAN_API_KEY=...         # ... for BSCScan
POLYGONSCAN_API_KEY=...     # ... for PolygonScan
FTMSCAN_API_KEY=...         # ... for FTMScan
SNOWTRACE_API_KEY=...       # ... for Snowtrace
ARBISCAN_API_KEY=...        # ... for Arbiscan
ADMIN_WALLET_ADDRESS=...    # Mandatory to deploy contracts with admin tasks (e.g. ChainlinkConversionPath)
DEPLOYER_MASTER_KEY=...     # Mandatory to deploy the request deployer smart contract on live blockchains
REQUEST_DEPLOYER_LIVE=...   # Must be true to deploy contracts through the request deployer on live blockchains.
NETWORK=...                 # List of network to deploy contracts on with the request deployer. If not set default to all supported chain.
```

## Usage

Library usage:

```js
import * as SmartContracts from '@requestnetwork/smart-contracts';
import { erc20FeeProxyArtifact } from '@requestnetwork/smart-contracts';
import { providers } from 'ethers';

const requestHashStorageMainnetAddress =
  SmartContracts.requestHashStorageArtifact.getAddress('mainnet');

const requestHashSubmitterRinkebyAddress =
  SmartContracts.requestHashSubmitterArtifact.getAddress('rinkeby');

const requestHashStorageABI = SmartContracts.requestHashStorageArtifact.getContractAbi();

const erc20FeeProxyInstance = erc20FeeProxyArtifact.connect(
  // network.name
  'private',
  // RPC Provider or Signer
  new providers.JsonRpcProvider(),
);
```

## Smart Contracts

The package stores the following smart contracts:

**Smart contracts for request deployment**

- `RequestDeployer` smart contract to which we delegate our deployment through the function `deploy(value, salt, bytecode)`. It enables to deploy contract with the `CREATE2` opcode to easily manage our contract deployment addresses.

**Smart contracts for ethereum-storage package**

- `RequestHashStorage` allows to declare a hash `NewHash(hash, submitter, feesParameters)`. Only a whitelisted contract can declare hashes.
- `RequestOpenHashSubmitter` entry point to add hashes in `RequestHashStorage`. It gives the rules to get the right to submit hashes and collect the fees. This contract must be whitelisted in `RequestHashStorage`. The only condition for adding hash is to pay the fees.
- `StorageFeeCollector` parent contract (not deployed) of `RequestOpenHashSubmitter`, computes the fees and send them to the burner.

**Smart contracts for advanced-logic package**

- `TestERC20` minimal erc20 token used for tests.
- `ERC20Proxy` used to pay requests with an ERC20 proxy contract payment network
- `EthereumProxy` used to pay requests in blockchain native tokens such as ETH on mainnet
- `ERC20FeeProxy` used to pay requests in ERC20 with a fee for the builder [cf. the payment network ERC20 with fee](../advanced-logic/specs/payment-network-erc20-fee-proxy-contract-0.1.0.md)
- `ERC20ConversionProxy` used to process a payment in ERC20 for an amount fixed in fiat, relying on `ERC20FeeProxy`, [cf. the payment network any-to-erc20](../advanced-logic/specs/payment-network-erc20-fee-proxy-contract-0.1.0.md)

**Smart contracts for payments with swaps**

- `ERC20SwapToPay` same as `ERC20FeeProxy` but allowing the payer to swap another token before paying
- `ERC20SwapToConversion` same as `ERC20ConversionProxy` but allowing the payer to swap another token before paying

## Local deployment

The smart contracts can be deployed locally with the following commands:

```bash
git clone https://github.com/RequestNetwork/requestNetwork.git
cd requestNetwork/packages/smart-contracts
# Install packages
yarn install
# Compile smart contracts, generate types and build the library
yarn build
# Run an instance of Ganache, ready for testing
yarn ganache
```

And in another terminal, deploy the smart contracts locally with:

```bash
yarn run deploy
```

## Live deployment

The request deployer enables multichain deployment of several smart contracts at predefined address. It is based on https://github.com/pcaversaccio/xdeployer

The deployer contract should be deployed at `0xE99Ab70a5FAE59551544FA326fA048f7B95A24B2` on live chains.

Be sure to run `yarn build:sol` before deploying the deployer or a contract.

The contracts implemented are listed in the array `create2ContractDeploymentList` in [Utils](scripts-create2/utils.ts).

### Deploy the request deployer (once per chain)

Environment variables needed: `DEPLOYER_MASTER_KEY`

```bash
yarn hardhat deploy-deployer-contract --network <NETWORK>
```

### Compute the contract addresses

Run:

```bash
yarn hardhat compute-contract-addresses
```

It will compute the addresses of the contracts to be deployed via the request deployer.

### Deploy the contracts

Depending on the xdeployer config, this script will deploy the smart contracts on several chain simultaneously
Environment variables needed: `ADMIN_PRIVATE_KEY`
You will need the request deployer to be deployed.
Then run:

To deploy all contracts to one network, use:

```bash
NETWORK=<NETWORK> yarn hardhat deploy-contracts-through-deployer
```

If you want to deploy all contracts on all networks:

```bash
yarn hardhat deploy-contracts-through-deployer
```

To deploy on live chains set `REQUEST_DEPLOYER_LIVE` to true

This command will output details about each contract deployment on each chain:

- If successfull: the network, the contract address and block number
- If already deployed: the network, and the contract address
- If an error occured: the said error

### Verify the contracts

Verify and publish the contract code automatically to blockchain explorers, right after smart contracts compilation.
Environment variables needed: `ADMIN_...` key and wallet, `ETHERSCAN_API_KEY`, and `REQUEST_DEPLOYER_LIVE`.
Depending on the contracts you're verifying you will need to set up `WEB3_PROVIDER_URL`.
See `hardhat.config.ts`.

```bash
yarn hardhat verify-contract-from-deployer --network <NETWORK>
```

### Add the contracts to Tenderly

Once the contract has been added to the artifacts (`./src/lib/artifacts`), run the following command to synchronize
contracts with the Tenderly account.
Environment variables needed: `TENDERLY_...` (see `hardhat.config.ts`).

```bash
yarn hardhat tenderly-monitor-contracts
```

### Verify the RequestDeployer contract

If the RequestDeployer contract verification failed initially, it can be verified with:

```bash
yarn hardhat verify-deployer-contract --network <NETWORK>
```

#### Verify the contracts manually With Hardhat (legacy)

A more generic way to verify any contract by setting constructor argments manually:

```bash
yarn hardhat verify --network NETWORK_NAME DEPLOYED_CONTRACT_ADDRESS "Constructor argument 1"
```

### Deprecated payment deployment scripts (legacy)

The goal of this script is to let all our payment contracts be deployed with the same sequence on every chain.

The script also verify deployed contracts.

**Be sure that artifacts are up-to-date with most recent deployments**

Environment variables needed: `ETHERSCAN_API_KEY`, `ADMIN_WALLET_ADDRESS`, `DEPLOYMENT_PRIVATE_KEY`

```bash
# First check what will be done
yarn hardhat deploy-live-payments --network matic --dry-run

# Run
yarn hardhat deploy-live-payments --network matic

# To test locally
yarn hardhat deploy-live-payments --network private --force
yarn hardhat deploy-live-payments --network private --force --dry-run
```

## ZkSyncEra support

### Compilation

To compile the contracts with the zkSync compiler, we use the same compile task but with the zkSync network specified.

```bash
yarn hardhat compile --network zksyncera
```

The compiled results go in separate directories build-zk and cache-zk.
In order for the zkSync compiler to be activated, this networks has the `zksync: true` flag in the hardhat.config.ts file.

### Deployment

We have deployment scripts in the /deploy directory for contracts ERC20FeeProxy, EthereumFeeProxy and BatchPayments.
These are different deploy scripts than regular EVM ones because they use the zkSync deploy package.

We deploy with the following commands:

First deploy the Proxy contracts:

```bash
yarn hardhat deploy-zksync --script deploy-zk-proxy-contracts --network zksyncera
```

Then deploy the Batch contract:

```bash
yarn hardhat deploy-zksync --script deploy-zk-batch-contracts --network zksyncera
```

We don't have deploy scripts for our Conversion proxy because there is no Chainlink feed yet on this chain.

## Administrate the contracts

The contracts to be updated are listed in the array `create2ContractDeploymentList` in [Utils](scripts-create2/utils.ts).
Modify the content of the array depending on your need when you perform an administration task.
Environment variables needed: `ADMIN_PRIVATE_KEY`

To update the contracts on one network, use:

```bash
NETWORK=<NETWORK> yarn hardhat update-contracts
```

If you want to update the contracts on all networks:

```bash
yarn hardhat update-contracts
```

This command will output details about each update on each chain

By default, updates are performed by a Safe wallet. They need to be confirmed by co-owners in the RN Admin Safe.
If the contracts are to be administrated by an EOA, use the flag `eoa`:

```bash
yarn hardhat update-contracts --eoa
```

If you want to transfer the ownership of eligible contracts (Payment contracts that have owners / admins) run:

```bash
yarn hardhat transfer-ownership
```

Similarly to the previous examples, you can use this command for all networks at once, or specify one in particular.
If the ownership is transferred from an EOA, use the flag `eoa`;

## Tests

After a local deployment:

```bash
yarn test
```

## Configuration

Networks and providers are configured in [hardhat.config.ts](hardhat.config.ts).

Have a look at the [Hardhat documentation](https://hardhat.org/config/).

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
[Read the contributing guide](/CONTRIBUTING.md)

## License

[MIT](/LICENSE)
