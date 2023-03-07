# @requestnetwork/currency

`@requestnetwork/currency` is a typescript library part of the [Request Network protocol](https://github.com/RequestNetwork/requestNetwork).
It is a collection of tools for the currencies and chains shared between the @requestnetwork packages.

## Installation

```bash
npm install @requestnetwork/currency
```

## Usage

```javascript
import { RequestLogicTypes } from '@requestnetwork/types';
import { Currency, Token } from '@requestnetwork/currency';

const decimals = new Currency({
  type: RequestLogicTypes.CURRENCY.ETH,
  value: 'ETH',
}).getDecimals();

console.log(decimals); // 18

const ETHHash = new Currency({
  type: RequestLogicTypes.CURRENCY.ETH,
  value: 'ETH',
}).getHash();

console.log(ETHHash); // 0xF5AF88e117747e87fC5929F2ff87221B1447652E

// Get currencies from their symbol
const ETHCurrency: RequestLogicTypes.ICurrency = Currency.from('ETH');
const FAUCurrency: RequestLogicTypes.ICurrency = Currency.from('DAI');
// Get currencies from their address
const DAICurrency: RequestLogicTypes.ICurrency = Currency.from(
  '0x6B175474E89094C44Da98b954EedeAC495271d0F',
);

console.log(FAUCurrency.toString()); // FAU-rinkeby
console.log(DAICurrency.toString()); // DAI

// Get a token symbol from its address
const FAUToken = Token.from('0xFab46E002BbF0b4509813474841E0716E6730136');

console.log(FAUToken.symbol); // FAU
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
[Read the contributing guide](/CONTRIBUTING.md)

### Adding a new chain

Supported chains are listed in `src/chains`:

- `src/chains/btc/data` for BTC type chains
- `src/chains/evm/data` for EVM type chains
- `src/chains/near/data` for NEAR type chains

The chain names are subjective, but they are unique and uniform across all Request Network packages.
They are formatted with the kebab-case naming convention.

In order to add a new chain, first create a file `[nameOfTheChain].ts` in the correct directory.
Its internal structure should conform with the corresponding type, respectively:

- `BtcChain`
- `EvmChain`
- `NearChain`

These types are described in the `index.ts` file of each chain subdirectory.
Please add the `testnet: true` property for staging chains.

## License

[MIT](/LICENSE)
