# Request Network TRON Substreams

This package contains a Substreams module for indexing ERC20FeeProxy payment events on the TRON blockchain.

## Overview

The module indexes `TransferWithReferenceAndFee` events from the deployed ERC20FeeProxy contracts:

- **Mainnet**: `TCUDPYnS9dH3WvFEaE7wN7vnDa51J4R4fd`
- **Nile Testnet**: `THK5rNmrvCujhmrXa5DB1dASepwXTr9cJs`

## Prerequisites

1. **Rust toolchain** with `wasm32-unknown-unknown` target:

   ```bash
   rustup target add wasm32-unknown-unknown
   ```

2. **Substreams CLI**:

   ```bash
   brew install streamingfast/tap/substreams
   ```

3. **bs58 crate** for Base58 encoding (included in dependencies)

## Building

```bash
# Build the WASM module
make build

# Generate protobuf types
make protogen

# Package for deployment
make package
```

## Running Locally

```bash
# Run with GUI for debugging
make gui

# Run and output to console
make run
```

## Deployment

### Deploy as Substreams-powered Subgraph

1. Build and package the Substreams module:

   ```bash
   make package
   ```

2. Deploy to The Graph:
   ```bash
   graph deploy --studio request-payments-tron
   ```

### Subgraph Endpoints

Once deployed, the subgraph will be available at:

- **Mainnet**: `https://api.studio.thegraph.com/query/67444/request-payments-tron/version/latest`
- **Nile Testnet**: `https://api.studio.thegraph.com/query/67444/request-payments-tron-nile/version/latest`

## Module Details

### `map_erc20_fee_proxy_payments`

Extracts payment events from TRON blocks:

**Input**: `sf.tron.type.v1.Block`

**Output**: `request.tron.v1.Payments`

**Fields extracted**:

- `token_address` - TRC20 token contract address
- `to` - Payment recipient
- `amount` - Payment amount
- `payment_reference` - Indexed payment reference (hex)
- `fee_amount` - Fee amount
- `fee_address` - Fee recipient
- `from` - Sender address
- `block` - Block number
- `timestamp` - Block timestamp (Unix seconds)
- `tx_hash` - Transaction hash
- `contract_address` - ERC20FeeProxy contract address

## Testing

```bash
make test
```

## License

MIT
