# @requestnetwork/currency

`@requestnetwork/currency` is a typescript library part of the [Request Network protocol](https://github.com/RequestNetwork/requestNetwork).
It is a collection of tools for the currencies shared between the @requestnetwork packages.

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

## License

[MIT](/LICENSE)
