# `@requestNetwork/prototype-estimator`

> Run test cases on the v2 system to give estimates of size and throughput

`Size` is the size on IPFS
`Count per second` is the number of transactions made from the client-side library to a local Request node

## Usage

`yarn run start`

## Example

`>yarn run start`

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
