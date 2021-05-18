import { getInvoiceTotal } from '../../src/format/rnf_invoice';

const baseInvoiceItem = {
  name: 'test 1',
  currency: 'EUR',
  quantity: 1,
  unitPrice: '1000',
  tax: { type: 'percentage', amount: '0' } as const,
};

const baseInvoice = {
  meta: { format: 'rnf_invoice', version: '0.0.3' } as const,
  invoiceNumber: '1',
  creationDate: new Date().toISOString(),
};

describe('getInvoiceTotal', () => {
  it('supports single items', () => {
    expect(
      getInvoiceTotal({
        ...baseInvoice,
        invoiceItems: [baseInvoiceItem],
      }).toString(),
    ).toEqual('1000');
  });

  it('supports single items with quantity', () => {
    expect(
      getInvoiceTotal({
        ...baseInvoice,
        invoiceItems: [{ ...baseInvoiceItem, quantity: 2 }],
      }).toString(),
    ).toEqual('2000');
  });

  it('supports multiple items', () => {
    expect(
      getInvoiceTotal({
        ...baseInvoice,
        invoiceItems: [
          { ...baseInvoiceItem, unitPrice: '1000' },
          { ...baseInvoiceItem, unitPrice: '500' },
        ],
      }).toString(),
    ).toEqual('1500');
  });

  it('supports rnf_invoice 0.0.2 items with taxPercent tax', () => {
    expect(
      getInvoiceTotal({
        ...baseInvoice,
        meta: {
          format: 'rnf_invoice',
          version: '0.0.2',
        },
        invoiceItems: [
          {
            ...baseInvoiceItem,
            unitPrice: '1500000',
            quantity: 1,
            taxPercent: 10,
          },
        ],
      }).toString(),
    ).toEqual('1650000');
  });

  it('supports single items with fixed tax', () => {
    expect(
      getInvoiceTotal({
        ...baseInvoice,
        invoiceItems: [
          {
            ...baseInvoiceItem,
            unitPrice: '1500000',
            tax: { amount: '500000', type: 'fixed' },
          },
        ],
      }).toString(),
    ).toEqual('2000000');
  });

  it('supports single item with percentage discount', () => {
    expect(
      getInvoiceTotal({
        ...baseInvoice,
        invoiceItems: [
          {
            ...baseInvoiceItem,
            unitPrice: '1500000',
            discount: '1000000',
          },
        ],
      }).toString(),
    ).toEqual('500000');
  });

  it('supports single item with tax', () => {
    expect(
      getInvoiceTotal({
        ...baseInvoice,
        invoiceItems: [
          {
            ...baseInvoiceItem,
            unitPrice: '1500000',
            tax: { amount: '12', type: 'percentage' },
          },
        ],
      }).toString(),
    ).toEqual('1680000');
  });

  it('supports single item with tax and percentage discount', () => {
    expect(
      getInvoiceTotal({
        ...baseInvoice,
        invoiceItems: [
          {
            ...baseInvoiceItem,
            unitPrice: '1500000',
            discount: '1000000',
            tax: { amount: '12', type: 'percentage' },
          },
        ],
      }).toString(),
    ).toEqual('560000');
  });

  it('supports single item with fixed tax and discount', () => {
    expect(
      getInvoiceTotal({
        ...baseInvoice,
        invoiceItems: [
          {
            ...baseInvoiceItem,
            unitPrice: '1500000',
            discount: '1000000',
            tax: { amount: '500000', type: 'fixed' },
          },
        ],
      }).toString(),
    ).toEqual('1000000');
  });

  it('supports floating quantity', () => {
    expect(
      getInvoiceTotal({
        ...baseInvoice,
        invoiceItems: [
          {
            ...baseInvoiceItem,
            unitPrice: '1500000',
            quantity: 0.333,
          },
        ],
      }).toString(),
    ).toEqual('499500');
  });

  it('supports floating tax', () => {
    expect(
      getInvoiceTotal({
        ...baseInvoice,
        invoiceItems: [
          {
            ...baseInvoiceItem,
            unitPrice: '1500000',
            tax: {
              type: 'percentage',
              amount: '1.011',
            },
          },
        ],
      }).toString(),
    ).toEqual('1515165');
  });
});
