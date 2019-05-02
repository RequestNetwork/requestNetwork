# @requestnetwork/prototype-estimator

`@requestnetwork/prototype-estimator` is a typescript script part of the [Request Network protocol](https://github.com/RequestNetwork/requestNetwork).
The script runs test cases on the v2 system to give estimates of size and throughput. The result is given as a `console.table` in the standard output.
It is useful to measure and keep track of the size of requests in the storage, and the throughput of the system.

`Size` is the size on IPFS
`Count per second` is the number of transactions made from the request-client.js library to a local Request node

## Usage

```bash
npm run start
```

## Example

`>npm run start`

```
yarn run v1.13.0
$ ts-node src/index.ts
┌─────────┬────────────────────────────────────────────────────────┬──────┬─────────────┐
│ (index) │                          name                          │ size │ countPerSec │
├─────────┼────────────────────────────────────────────────────────┼──────┼─────────────┤
│    0    │                       'created'                        │ 1021 │     12      │
│    1    │ 'created + small content ({"reference":"OA7637DRGK"})' │ 1184 │             │
│    2    │  'created + long content (example-valid-0.0.2.json)'   │ 2828 │     12      │
│    3    │                  'created + accepted'                  │ 1751 │             │
│    4    │        'created + accepted + increase + reduce'        │ 3283 │             │
└─────────┴────────────────────────────────────────────────────────┴──────┴─────────────┘
Done in 1.82s.
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
[Read the contributing guide](/CONTRIBUTING.md)

## License

[MIT](/LICENSE)
