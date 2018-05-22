# Request Network Data Format

## Introduction
Welcome to the Request Network Data Format documentation! Request Network Data Format is a Json Schema library providing standard for the data of the Request Network protocol. 

It also provide a Javascript entry point to validate a given JSON.

## Warning
This is still an alpha version which will evolve significantly before the main net release. 

## Available JSON Schema
| Name | Last version | Last version | Description |
| ------------ | ------------ | ------------ | ------------ | 
| [Invoice](/packages/requestNetworkDataFormat/src/format/rnf_invoice) | rnf_invoice | 0.0.1 | Format to create an invoice  |


## Javascript entry point

### Install with NPM
`npm install requestnetwork-data-format --save`

### Install with Yarn
`yarn add requestnetwork-data-format`

### Using
```js
import RequestNetworkDataFormat from 'requestnetwork-data-format';

let result = RequestNetworkDataFormat.validate(A_JSON_OBJECT);

if (!result.valid) {
    // use the errors from result.errors
}
```
