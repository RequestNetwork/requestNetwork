export interface Invoice {
  meta: {
    format: 'rnf_invoice';
    version: string;
  };
  buyerInfo?: ActorInfo;
  creationDate: string;
  invoiceItems: InvoiceItem[];
  invoiceNumber: string;
  miscellaneous?: unknown;
  note?: string;
  paymentTerms?: PaymentTerms;
  purchaseOrderId?: string;
  sellerInfo?: ActorInfo;
  terms?: string;
}

export interface InvoiceItem {
  currency: string;
  deliveryDate?: string;
  deliveryPeriod?: string;
  discount?: string;
  name: string;
  quantity: number;
  reference?: string;
  /**
   * @deprecated since 0.0.3. Use tax instead
   */
  taxPercent?: number;
  tax: Tax;
  unitPrice: string;
}

export interface Tax {
  type: 'percentage' | 'fixed';
  amount: string;
}

export interface ActorInfo {
  address?: Address;
  businessName?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  miscellaneous?: unknown;
  phone?: string;
  taxRegistration?: string;
}

export interface PaymentTerms {
  dueDate?: string;
  lateFeesFix?: string;
  lateFeesPercent?: number;
  miscellaneous?: unknown;
}

export interface Address {
  'country-name'?: string;
  'extended-address'?: string;
  locality?: string;
  'post-office-box'?: string;
  'postal-code'?: string;
  region?: string;
  'street-address'?: string;
}
