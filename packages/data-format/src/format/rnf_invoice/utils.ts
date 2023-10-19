import { BigNumber, FixedNumber } from 'ethers';
import { Invoice, InvoiceItem } from './types.js';

export const getInvoiceTotal = (invoice: Invoice): BigNumber => {
  return invoice.invoiceItems.reduce(
    (acc, item) => acc.add(getInvoiceLineTotal(item)),
    BigNumber.from(0),
  );
};

export const getInvoiceLineTotal = (item: InvoiceItem): BigNumber => {
  // Support for rnf_version < 0.0.3
  const tax = item.taxPercent
    ? { type: 'percentage', amount: String(item.taxPercent) }
    : item.tax || { type: 'percentage', amount: '0' };

  const taxPercent = tax.amount && tax.type === 'percentage' ? Number(tax.amount) + 100 : 100;
  const taxFixed =
    tax.amount && tax.type === 'fixed' ? BigNumber.from(tax.amount) : BigNumber.from(0);
  const discount = item.discount ? BigNumber.from(item.discount) : BigNumber.from(0);

  return BigNumber.from(
    FixedNumber.from(item.unitPrice)
      // accounts for floating quantities
      .mulUnsafe(FixedNumber.fromString(item.quantity.toString()))
      .subUnsafe(FixedNumber.from(discount))
      // accounts for floating taxes
      .mulUnsafe(FixedNumber.fromString(taxPercent.toString()))
      // Removes the percentage multiplier
      .divUnsafe(FixedNumber.from(100))
      .addUnsafe(FixedNumber.from(taxFixed))
      .round(0)
      .toString()
      // Removes the .0
      .split('.')[0],
  );
};

export const getInvoiceTotalWithoutTax = (invoice: Invoice): BigNumber => {
  return invoice.invoiceItems.reduce(
    (acc, item) => acc.add(getInvoiceLineTotalWithoutTax(item)),
    BigNumber.from(0),
  );
};

export const getInvoiceLineTotalWithoutTax = (item: InvoiceItem): BigNumber => {
  const discount = item.discount ? BigNumber.from(item.discount) : BigNumber.from(0);

  return BigNumber.from(
    FixedNumber.from(item.unitPrice)
      // accounts for floating quantities
      .mulUnsafe(FixedNumber.fromString(item.quantity.toString()))
      .subUnsafe(FixedNumber.from(discount))
      .round(0)
      .toString()
      .split('.')[0],
  );
};

export const getInvoiceTaxTotal = (invoice: Invoice): BigNumber => {
  const invoiceTotalWithoutTax = invoice.invoiceItems.reduce(
    (acc, item) => acc.add(getInvoiceLineTotalWithoutTax(item)),
    BigNumber.from(0),
  );
  const invoiceTotal = invoice.invoiceItems.reduce(
    (acc, item) => acc.add(getInvoiceLineTotal(item)),
    BigNumber.from(0),
  );
  return invoiceTotal.sub(invoiceTotalWithoutTax);
};
