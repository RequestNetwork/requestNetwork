# Invoice format

| Name | Type | Need | Comment |
| ------------ | ------------ | ------------ | ------------ |
| meta |  object | Mandatory | see below "meta" |
| creationDate | date-time | Mandatory | Creation date of the request |
| invoiceNumber | string | Mandatory | numbering of the seller invoices - specific to the seller |
| purchaseOrderId | string | Optional | allows to match the request with an orderId -  specific to the seller |
| note | string | Optional | add a note to the buyer |
| terms | string | Optional | add sale terms to the buyer |
| sellerInfo | object | Optional | see below "sellerInfo" |
| buyerInfo | object | Optional | see below "buyerInfo" |
| invoiceItems | array | Mandatory | see below "invoiceItems" |
| paymentTerms | object | Optional | see below "paymentTerms" |
| miscellaneous | object | Optional | Miscellaneous information |


## meta

*Information about the format of the json*

| Name | Type | Need | Comment |
| ------------ | ------------ | ------------ | ------------ |
| format |  constant | Mandatory | value: "rnf_invoice" |
| version |  constant | Mandatory | value: "0.0.1"|


## sellerInfo

*Information about the seller*

| Name | Type | Need | Comment |
| ------------ | ------------ | ------------ | ------------ |
| email | string _(format: email)_ | Optional | email |
| firstName | string | Optional | first name |
| lastName | string | Optional | last name |
| businessName | string | Optional | business name |
| phone | string | Optional | phone number |
| address | object | Optional | address formated as [http://json-schema.org/address](http://json-schema.org/learn/examples/address.schema.json) |
| taxRegistration | string | Optional | tax registration number |
| companyRegistration | string | Optional | company registration number |
| miscellaneous | object | Optional | Miscellaneous information |


## buyerInfo

*Information about the buyer*

| Name | Type | Need | Comment |
| ------------ | ------------ | ------------ | ------------ |
| email | string _(format: email)_ | Optional | email |
| firstName | string | Optional | first name |
| lastName | string | Optional | last name |
| businessName | string | Optional | business name |
| phone | string | Optional | phone number |
| address | object | Optional | address formated as [http://json-schema.org/address](http://json-schema.org/learn/examples/address.schema.json) |
| taxRegistration | string | Optional | tax registration number |
| companyRegistration | string | Optional | company registration number |
| miscellaneous | object | Optional | Miscellaneous information |


## invoiceItems

*List of the items of the invoices*

| Name | Type | Need | Comment |
| ------------ | ------------ | ------------ | ------------ |
| name | string | Mandatory | name of the item |
| reference | string | Optional | reference of the item |
| quantity | number | Mandatory | quantity (minimum 0) |
| unitPrice | number | Mandatory | unit price (minimum 0) |
| discount | number | Optional | price of the discount |
| taxPercent | number | Mandatory | taxation percentage of the item |
| currency | string | Mandatory | ISO 4217 currency code |
| deliveryDate | date-time | Optional | expected delivery date |
| deliveryPeriod | string | Optional | period of delivery if the item is a service |


## paymentTerms

*Payment terms*

| Name | Type | Need | Comment |
| ------------ | ------------ | ------------ | ------------ |
| dueDate | date-time | Optional | payment deadline |
| lateFeesPercent | number | Optional | percentage of fees applied if late payment |
| lateFeesFix | number | Optional | fixed fees applied if late payment |
| miscellaneous | object | Optional | Miscellaneous information |

