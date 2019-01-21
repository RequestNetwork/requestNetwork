# `@requestNetwork/prototype-estimator`

> Run test cases on the v2 system to give estimates of size and throughput

## Usage

`yarn run start`

## Example

`>yarn run start`

```
yarn run v1.13.0
$ ts-node src/index.ts
┌─────────┬──────────────────────────────────────────┬──────┐
│ (index) │                   name                   │ size │
├─────────┼──────────────────────────────────────────┼──────┤
│    0    │                'created'                 │ 1021 │
│    1    │           'created + accepted'           │ 1751 │
│    2    │ 'created + accepted + increase + reduce' │ 3283 │
└─────────┴──────────────────────────────────────────┴──────┘
Done in 1.82s.
```
