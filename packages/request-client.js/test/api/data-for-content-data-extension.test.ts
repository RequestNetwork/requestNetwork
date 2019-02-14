// tslint:disable:object-literal-sort-keys
// tslint:disable:object-literal-key-quotes
export default {
  meta: {
    format: 'rnf_invoice',
    version: '0.0.2',
  },

  creationDate: '2018-01-01T18:25:43.511Z',
  invoiceNumber: '123456789',
  purchaseOrderId: '987654321',
  note: 'this is an example of invoice',
  terms: 'there is no specific terms',

  sellerInfo: {
    email: 'jean.valjean@miserables.fr',
    firstName: 'Jean',
    lastName: 'Valjean',
    phone: '+33606060606',
    address: {
      locality: 'Paris',
      'postal-code': 'F-75002',
      'street-address': '38 avenue Opera',
      'country-name': 'France',
    },
    miscellaneous: {
      aliases: ['Ultime Fauchelevent', 'Urbain Fabre', 'Prisoner 24601', 'Prisoner 9430'],
    },
  },

  buyerInfo: {
    email: 'javertlimited@detective.com',
    businessName: 'Javert Limited',
    phone: '+16501123456',
    address: {
      locality: 'Seattle',
      region: 'WA',
      'country-name': 'United-State',
      'postal-code': '98052',
      'street-address': '20341 Whitworth Institute 405 N. Whitworth',
    },
    miscellaneous: {
      Occupation: ['Prison guard', 'Police inspector', 'Detective'],
    },
  },

  invoiceItems: [
    {
      name: 'Candlestick',
      reference: 'cs666',
      quantity: 2,
      unitPrice: '100',
      discount: '01',
      taxPercent: 16.9,
      currency: 'XT',
      deliveryDate: '2019-01-01T18:25:43.511Z',
    },
    {
      name: 'handcuff',
      reference: 'hc99',
      quantity: 1,
      unitPrice: '1234',
      taxPercent: 5.5,
      currency: 'XTSS',
      deliveryDate: '2019-01-01T18:25:43.511Z',
    },
  ],

  paymentTerms: {
    dueDate: '2019-06-01T18:25:43.511Z',
    lateFeesPercent: 10,
    lateFeesFix: '1',
    miscellaneous: {
      note: 'payment before chrismas',
    },
  },

  miscellaneous: {
    manufacturerCompany: 'Victor Hugo & Co.',
    deliveryCompany: 'Gavroche Express',
  },
};
