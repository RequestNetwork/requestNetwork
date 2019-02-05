# @requestnetwork/data-format

`@requestnetwork/data-format` is a typescript library part of the [Request Network protocol].It is a JSON Schema library providing standard for the data of the Request Network protocol. It also provide a javascript entry point to validate a given JSON.

## Installation

```bash
npm install @requestnetwork/data-format
```

### Usage

```js
import dataFormat from '@requestnetowrk/data-format';

let result = data - format.validate(A_JSON_OBJECT);

if (!result.valid) {
  // use the errors from result.errors
}
```

## Available JSON Schema

| Name                                                    | Last version | Last version | Description                 |
| ------------------------------------------------------- | ------------ | ------------ | --------------------------- |
| [Invoice](/packages/data-format/src/format/rnf_invoice) | rnf_invoice  | 0.0.2        | Format to create an invoice |
