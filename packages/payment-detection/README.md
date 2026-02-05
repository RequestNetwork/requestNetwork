# @requestnetwork/payment-detection

`@requestnetwork/payment-detection` is a TypeScript library part of the [Request Network protocol](https://github.com/RequestNetwork/requestNetwork).
It contains the implementation of request-related events interpretations, typically onchain payments of requests.

The interpretation of events is specified by the payment extension added to the request. [Cf. advanced-logic specifications](../advanced-logic/specs/).

# Balance and events

If a payment network has been given to the request, the payment detection can be done.

Based on information found in the payment network state, and included manual payment declarations, the library will perform queries and feed the property `balance` of the request with:

- `balance`: the detected amount paid on the request, in request currency
- `events`: all the payments, payment declarations, refunds, and other balance-related events with the amount, timestamp etc...

# Retrievers and detectors

This library relies on two concepts:

- **Retrievers** perform RPC or TheGraph calls and fetch relevant events. Balance-impacting events are fetched with `InfoRetrievers`, implementing the `getTransferEvents()` method (cf. [IPaymentRetriever](./src/types.ts))
- **Payment detectors** implement the interface **PaymentTypes.IPaymentNetwork**, with the method `getBalance()`, which calls retrievers and interpret events according to the payment network (cf. [Abstract PaymentDetectorBase](./src/payment-detector-base.ts)). `getBalance()` returns the balance as well as events: payments, refunds, and possibly other events (declarations, escrow events...)

## PaymentDetectorBase

A good part of the logic is implemented in the abstract class `PaymentDetectorBase`:

```typescript
export abstract class PaymentDetectorBase<
  TExtension extends ExtensionTypes.IExtension,
  TPaymentEventParameters,
> implements PaymentTypes.IPaymentNetwork<TPaymentEventParameters>
{
  public async getBalance(
    request: RequestLogicTypes.IRequest,
  ): Promise<PaymentTypes.IBalanceWithEvents<TPaymentEventParameters>> {
    // ...

    // getEvents() should be implemented by children payment detectors, and use appropriate retrievers
    // For example: RPC or The Graph based retriever
    const rawEvents = await this.getEvents(request);
    // ...
    // computeBalance() sums up all payment events and deduces all refunds.
    const balance = this.computeBalance(events).toString();

    return {
      balance,
      events,
    };
  }
}
```

[cf. full implementation](./src/payment-detector-base.ts)

## Subgraph-based payment retrievers

For TheGraph-based information retrieval, a client can be retrieved using `getTheGraphClient()` in `./src/thegraph/index.ts`. It provides a strongly typed interface, generated based on the queries in `/src/thegraph/queries`.

The automated type generation is configured within files `./codegen.yml` (for EVM chains) and `./codegen-near.yml` (for Near) and output in `./src/thegraph/generated`.
It depends on the deployed subgraphs schema and on the queries.

The code generation is included in the pre-build script and can be run manually:

```sh
yarn codegen
```

## TRON Payment Detection (Hasura-based)

TRON payment detection uses a Hasura GraphQL API backed by a PostgreSQL database that is populated by a Substreams-based indexer. This approach was chosen because The Graph does not support subgraphs for native TRON (only TRON EVM).

### Architecture

```
TRON Blockchain → Substreams → PostgreSQL → Hasura GraphQL → SDK
```

The payment data flows through:

1. **Substreams**: Indexes ERC20FeeProxy payment events from the TRON blockchain
2. **PostgreSQL**: Stores payment data via `substreams-sink-sql`
3. **Hasura**: Exposes the PostgreSQL data as a GraphQL API
4. **SDK**: Queries Hasura via `TronInfoRetriever` and `HasuraClient`

### Components

- **`TronFeeProxyPaymentDetector`**: Payment detector for TRON ERC20 Fee Proxy payments
- **`TronInfoRetriever`**: Retrieves payment events from Hasura, implements `ITheGraphBaseInfoRetriever`
- **`HasuraClient`**: GraphQL client for querying the Hasura endpoint

### Usage

The `TronFeeProxyPaymentDetector` is automatically registered in the `PaymentNetworkFactory` for TRON networks (`tron` and `nile`).

```typescript
import { PaymentNetworkFactory } from '@requestnetwork/payment-detection';

// The factory automatically uses TronFeeProxyPaymentDetector for TRON
const paymentNetwork = PaymentNetworkFactory.getPaymentNetworkFromRequest({
  request,
  advancedLogic,
});

const balance = await paymentNetwork.getBalance(request);
```

### Custom Hasura Endpoint

By default, the `HasuraClient` connects to the production Hasura endpoint. To use a custom endpoint:

```typescript
import {
  HasuraClient,
  TronInfoRetriever,
  TronFeeProxyPaymentDetector,
} from '@requestnetwork/payment-detection';

// Create a custom Hasura client
const customClient = new HasuraClient({
  baseUrl: 'https://your-hasura-instance.com/v1/graphql',
});

// Use it with TronInfoRetriever
const retriever = new TronInfoRetriever(customClient);

// Or use getHasuraClient with custom options
import { getHasuraClient } from '@requestnetwork/payment-detection';

const client = getHasuraClient('tron', {
  baseUrl: 'https://your-hasura-instance.com/v1/graphql',
});
```

### TRON-specific Event Fields

TRON payment events include additional fields specific to the TRON blockchain:

```typescript
interface TronPaymentEvent {
  txHash: string;
  feeAmount: string;
  block: number;
  to: string;
  from: string;
  feeAddress?: string;
  tokenAddress?: string;
  // TRON-specific resource consumption
  energyUsed?: string; // Total energy consumed
  energyFee?: string; // Energy fee in SUN
  netFee?: string; // Network/bandwidth fee in SUN
}
```

### Supported Networks

| Network | Chain Identifier | Description       |
| ------- | ---------------- | ----------------- |
| `tron`  | `tron`           | TRON Mainnet      |
| `nile`  | `tron-nile`      | TRON Nile Testnet |

# Test

```sh
yarn run test
```
