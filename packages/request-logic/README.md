# @requestnetwork/request-logic

`@requestnetwork/request-logic` is a typescript library part of the [Request Network protocol](https://github.com/RequestNetwork/requestNetwork).
It is the default implementation of the Request Logic layer. This layer is responsible for the business logic: properties and actions of requests.

Request logic creates actions, that are signed and sends them to the layer below, Transaction.

## Installation

```bash
npm install @requestnetwork/request-logic
```

## Usage

See [packages/usage-examples/request-logic.ts](`packages/usage-examples/src/request-logic.ts`).

## Features

- `createRequest` : create a request
- `createEncryptedRequest` : create an encrypted request
- `acceptRequest` : accept a request
- `cancelRequest` : cancel a request
- `increaseExpectedAmountRequest` : increase the amount of a request
- `reduceExpectedAmountRequest` : reduce the amount of a request
- `getFirstRequestFromTopic` : get the first request from the actions indexed by a topic (should be used with requestId)
- `getRequestsByTopic` : get all the requests for a topic
- `computeRequestId` : compute the ID of a request before actually creating it.

## Action topics

When an action is sent to the Transaction layer, strings named topics can be attached to it. These topics are used to index the action and, therefore, allow to retrieve it later in order to reconstruct the request.

Every action has at least its request id as a topic.

When creating a request, arbitrary topics can be attached to the `createRequest` action to index the request. For example, it can be the identity of the request creator in order to be able, later, to retrieve every request created by a user. Other actions than `createRequest` doesn't need additional topics since it contains the request id that can be linked to the corresponding `createRequest` action of the request.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
[Read the contributing guide](/CONTRIBUTING.md)

## License

[MIT](/LICENSE)
