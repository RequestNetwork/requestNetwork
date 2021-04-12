# @requestnetwork/toolbox

`@requestnetwork/toolbox` is a typescript library part of the [Request Network protocol](https://github.com/RequestNetwork/requestNetwork).
It is a collection of miscellaneous tools.
This package can use other package of the monorepo, but the other packages cannot use toolbox.

## Usage

### Create request

Create a request. Only the amount can be specified, optionally.

- Currency: BTC
- Payee: 0x627306090abab3a6e1400e9345bc60c78a8bef57
- Payer: 0xf17f52151ebef6c7334fad080c5704d77216b732
- Amount (default): 1000

#### As a package

```javascript
import { CreateRequest } from '@requestnetwork/toolbox';

CreateRequest.createTestRequest();
CreateRequest.createTestRequest(12);
```

#### In the CLI

```bash
yarn run:create
yarn run:create 12
```

### Get conversion paths

Returns all the aggregators used for the any-to-erc20 proxy.
It can be used to populate the [currency pair](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/currency/src/chainlink-path-aggregators.ts#L9) (in @requestnetwork/currency) when we add a new aggregator to [ChainlinkConversionPath.sol](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/smart-contracts/src/contracts/ChainlinkConversionPath.sol) on any network.

```bash
yarn chainlinkPath

# ###################################################################
# All aggregators: (Used to list all the aggregators)
# {
#   network: {
#      "currencyIn": {
#        "currencyOut": "aggregator"
#        ...
#      }
#      ...
#   }
#   ...
# }
# All aggregators nodes for the currency pairs graph: (Used to populate @requestnetwork/currency)
# {
#   network: {
#      "currencyIn": {
#        "currencyOut": 1,
#        ...
#      }
#      ...
#   }
#   ...
# }
# ###################################################################
```

To get only aggregators of one network:

```bash
yarn chainlinkPath mainnet
```

To get a currency hash:

```bash
yarn request-toolbox currencyHash ETH
# #####################################################################
# Currency hash of: ETH
# 0xf5af88e117747e87fc5929f2ff87221b1447652e
# #####################################################################
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
[Read the contributing guide](/CONTRIBUTING.md)

## License

[MIT](/LICENSE)
