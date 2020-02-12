# Content Data

You can be interested in this document if:

- you want to create your own implementation of the Request protocol
- you are curious enough to dive and see what is under the hood of the Request protocol

Prerequisite: Having read the advanced logic specification (see [here](./advanced-logic-specs-0.1.0.md))

## Description

This extension allows linking content data to the request.
The content data can be used to give extra information about the request. You can find examples of content data format [here](/packages/data-format).

## Properties

| Property               | Type   | Description                         | Requirement   |
| ---------------------- | ------ | ----------------------------------- | ------------- |
| **id**                 | String | constant value: "content-data"      | **Mandatory** |
| **type**               | String | constant value: "contentData"       | **Mandatory** |
| **version**            | String | constant value: "0.1.0"             | **Mandatory** |
| **values**             | Object |                                     |               |
| **values.contentData** | Object | Content data to link to the request | **Mandatory** |

---

## Actions

### Creation

#### Parameters

|                            | Type   | Description                         | Requirement   |
| -------------------------- | ------ | ----------------------------------- | ------------- |
| **id**                     | String | constant value: "content-data"      | **Mandatory** |
| **type**                   | String | constant value: "contentData"       | **Mandatory** |
| **version**                | String | constant value: "0.1.0"             | **Mandatory** |
| **parameters**             | Object |                                     |               |
| **parameters.contentData** | Object | Content data to link to the request | **Mandatory** |

#### Conditions

None.

#### Warnings

None.

#### Results

A extension state is created with the following properties:

|  Property              |  Value                        |
| ---------------------- | ----------------------------- |
| **id**                 | "content-data"                |
| **type**               | "contentData"                 |
| **version**            | "0.1.0"                       |
| **values**             |                               |
| **values.contentData** | `contentData` from parameters |

---

### Updates

None.

## Interpretation

The content data can be used to document the request.

Example (see [here](/packages/data-format)):

```JSON
{
    "content": {
  "meta": {
    "format": "rnf_invoice",
    "version": "0.0.2"
  },

  "creationDate": "2018-01-01T18:25:43.511Z",
  "invoiceNumber": "123456789",
  "purchaseOrderId": "987654321",
  "note": "this is an example of invoice",
  "terms": "there is no specific terms",

  "sellerInfo": {
    "email": "jean.valjean@miserables.fr",
    "firstName": "Jean",
    "lastName": "Valjean",
    "phone": "+33606060606",
    "address": {
      "locality": "Paris",
      "postal-code": "F-75002",
      "street-address": "38 avenue de l'Opera",
      "country-name": "France"
    },
    "miscellaneous": {
      "aliases" : ["Ultime Fauchelevent", "Urbain Fabre", "Prisoner 24601", "Prisoner 9430"]
    }
  },

  "buyerInfo": {
    "email": "javertlimited@detective.com",
    "businessName": "Javert Limited",
    "phone": "+16501123456",
    "address": {
      "locality": "Seattle",
      "region": "WA",
      "country-name": "United-State",
      "postal-code": "98052",
      "street-address": "20341 Whitworth Institute 405 N. Whitworth"
    },
    "miscellaneous": {
      "Occupation" : ["Prison guard", "Police inspector", "Detective"]
    }
  },

  "invoiceItems": [{
      "name": "Candlestick",
      "reference": "cs666",
      "quantity": 2,
      "unitPrice": "100",
      "discount": "01",
      "taxPercent": 16.9,
      "currency": "XT",
      "deliveryDate": "2019-01-01T18:25:43.511Z"
    },{
      "name": "handcuff",
      "reference": "hc99",
      "quantity": 1,
      "unitPrice": "1234",
      "taxPercent": 5.5,
      "currency": "XTSS",
      "deliveryDate": "2019-01-01T18:25:43.511Z"
    }],

  "paymentTerms": {
    "dueDate": "2019-06-01T18:25:43.511Z",
    "lateFeesPercent": 10,
    "lateFeesFix": "1",
    "miscellaneous": {
      "note": "payment before chrismas"
    }
  },

  "miscellaneous": {
    "manufacturerCompany": "Victor Hugo & Co.",
    "deliveryCompany": "Gavroche Express"
  }
}
}
```
