import { Invoice, InvoiceItem } from './types';

export const getInvoiceTotal = (invoice: Invoice): bigint => {
  return invoice.invoiceItems.reduce(
    (acc, item) => acc + (getInvoiceLineTotal(item)),
    BigInt(0),
  );
};

export const getInvoiceLineTotal = (item: InvoiceItem): bigint => {
  // Support for rnf_version < 0.0.3
  const tax = item.taxPercent
    ? { type: 'percentage', amount: String(item.taxPercent) }
    : item.tax || { type: 'percentage', amount: '0' };

  const taxPercent = tax.amount && tax.type === 'percentage' ? Number(tax.amount) + 100 : 100;
  const taxFixed =
    tax.amount && tax.type === 'fixed' ? BigInt(tax.amount) : BigInt(0);
  const discount = item.discount ? BigInt(item.discount) : BigInt(0);

  return BigInt(
    (BigInt(item.unitPrice)
      // accounts for floating quantities
      * (BigInt(item.quantity.toString()))
      - (BigInt(discount)))
    // accounts for floating taxes
    * (BigInt(taxPercent.toString()))
    // Removes the percentage multiplier
    / (BigInt(100))
    + (BigInt(taxFixed))
      // .round(0)
      .toString()
      // Removes the .0
      .split('.')[0],
  );
};

export const getInvoiceTotalWithoutTax = (invoice: Invoice): bigint => {
  return invoice.invoiceItems.reduce(
    (acc, item) => acc + (getInvoiceLineTotalWithoutTax(item)),
    BigInt(0),
  );
};

export const getInvoiceLineTotalWithoutTax = (item: InvoiceItem): bigint => {
  const discount = item.discount ? BigInt(item.discount) : BigInt(0);

  return BigInt(
    (BigInt(item.unitPrice)
      // accounts for floating quantities
      * (BigInt(item.quantity.toString()))
      - (BigInt(discount)))
      // .round(0)
      .toString()
      .split('.')[0],
  );
};

export const getInvoiceTaxTotal = (invoice: Invoice): bigint => {
  const invoiceTotalWithoutTax = invoice.invoiceItems.reduce(
    (acc, item) => acc + (getInvoiceLineTotalWithoutTax(item)),
    BigInt(0),
  );
  const invoiceTotal = invoice.invoiceItems.reduce(
    (acc, item) => acc + (getInvoiceLineTotal(item)),
    BigInt(0),
  );
  return invoiceTotal - (invoiceTotalWithoutTax);
};
