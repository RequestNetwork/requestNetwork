# @requestnetwork/currency

`@requestnetwork/currency` is a typescript library part of the [Request Network protocol](https://github.com/RequestNetwork/requestNetwork).
It is a collection of tools for the currencies shared between the @requestnetwork packages.

## Installation

```bash
npm install @requestnetwork/currency
```

## Usage

```javascript
import Currency from '@requestnetwork/currency';

const decimals = Currency.getDecimalsForCurrency({
  type: RequestLogicTypes.CURRENCY.ETH,
  value: 'ETH',
};

console.log(decimals); // 18
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
[Read the contributing guide](/CONTRIBUTING.md)

## License

[MIT](/LICENSE)
