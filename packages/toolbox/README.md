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

To get aggregators of a network with a lot of blocks, you have to gather most updates with updateAggregatorsList.

Case 1: you only use updateAggregatorsList, and update every pair each time, take this block of its last execution.

```bash
yarn chainlinkPath --network=matic --firstBlock=$LAST_EXECUTION_BLOCK
```

Case 2: you used updateAggregator a few times after a full updateAggregatorsList (mass update), all within a blockspan of less than 100'000.

```bash
yarn chainlinkPath --network=matic --firstBlock=$MASS_UPDATE_BLOCK --lastBlock=$LAST_SINGLE_UPDATE_BLOCK
```

To get a currency hash:

```bash
yarn currencyHash ETH
# #####################################################################
# Currency hash of: ETH
# 0xf5af88e117747e87fc5929f2ff87221b1447652e
# #####################################################################

yarn currencyHash FTM-fantom
#####################################################################
Currency hash of: FTM-fantom
0x10bf4137b0558c33c2dc9f71c3bb81c2865fa2fb
#####################################################################
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
[Read the contributing guide](/CONTRIBUTING.md)

## License

[MIT](/LICENSE)
