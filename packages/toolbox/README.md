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
yarn request-toolbox request create
yarn request-toolbox request create 12
```

or if ran from the `/toolbox` folder

```bash
yarn cli request create
yarn cli request create 12
```

#### CLI Troubleshooting

If you receive the following error

```bash
error Command "request-toolbox" not found.
```

then build the toolbox package like bellow:

```bash
cd packages/toolbox
yarn --check-files
```

### Conversion paths

#### Adding & removing aggregators

The following command guides you in adding missing aggregators.

```bash
yarn request-toolbox addAggregators mainnet --privateKey $PRIVATE_KEY --dryRun
```

It will suggest pairs of currencies:

- With a Chainlink price feed oracle (according to [a cached JSON](https://cl-docs-addresses.web.app/addresses.json]))
- If they exist in Currency Manager (cf. [../currency/src/erc20/networks]())
- If they are not already added to the Chainlink Aggregation Path contract, as reported by the Price Aggregators subgraph ([Example for BSC](https://thegraph.com/hosted-service/subgraph/requestnetwork/price-aggregators-bsc))

The following commands are also available:

- `yarn request-toolbox addAggregator` can be used if you have all information about an aggregator you want to add
- `yarn request-toolbox removeAggregator` will set the given currency pair to the 0x00[...]00 address.
- `yarn request-toolbox listMissingAggregators <name>` (where `name` is a valid Request Finance currency list, [https://api.request.network/currency/list/name]() should be valid) will display missing aggregators for that list on all networks.

Use `--help` for details about each command.

#### Updating conversion paths

> NB: this procedure is only used to update the standard list.
> For an always up-to-date list, use the Aggregator Subgraphs
> _requires [jq](https://stedolan.github.io/jq/)_

```bash
./updateAggregators.sh mainnet
# or, depending on the network, you can specify the URL
WEB3_URL=https://polygon-mainnet.infura.io/v3/xxx ./updateAggregators.sh matic
git add ../currency
git commit ...
```

#### Getting conversion paths

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

You can change the default blockRange (some networks allow a very large range, some don't) with `maxRange`

```bash
yarn chainlinkPath mainnet --maxRange 1000000
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
