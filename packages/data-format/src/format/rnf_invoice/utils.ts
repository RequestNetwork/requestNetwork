import { BigNumber } from 'ethers';
import { Invoice, InvoiceItem } from './types';

export const getInvoiceTotal = (invoice: Invoice): BigNumber => {
  return invoice.invoiceItems.reduce(
    (acc, item) => acc.add(getInvoiceLineTotal(item)),
    BigNumber.from(0),
  );
};

export const getInvoiceLineTotal = (item: InvoiceItem): BigNumber => {
  // Every amount in currency is a big number with the good number of decimals for this currency
  // Tax percent is not an amount in currency. To allow a big number multiplication, we convert
  //  it temporarily with preciselyOne (allows 6 decimals, ie 0.123456%)
  const preciselyOne = 1000000;

  // Support for rnf_version < 0.0.3
  const tax = item.taxPercent
    ? { type: 'percentage', amount: String(item.taxPercent) }
    : item.tax || { type: 'percentage', amount: '0' };

  const taxPercent = tax.amount && tax.type === 'percentage' ? Number(tax.amount) + 100 : 100;
  const taxFixed =
    tax.amount && tax.type === 'fixed' ? BigNumber.from(tax.amount) : BigNumber.from(0);
  const discount = item.discount ? BigNumber.from(item.discount) : BigNumber.from(0);

  return (
    BigNumber.from(item.unitPrice)
      // account for floating quantities
      .mul(Number(item.quantity * preciselyOne).toFixed(0))
      .div(preciselyOne)
      .sub(discount)
      // Artificially offset the decimal to let the multiplication work
      .mul(Number(taxPercent * preciselyOne).toFixed(0))
      // Remove the decimal offset
      .div(preciselyOne)
      // Remove the percentage multiplier
      .div(100)
      .add(taxFixed)
  );
};
