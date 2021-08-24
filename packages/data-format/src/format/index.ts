import * as rnf_invoice_0_0_1 from './rnf_invoice/rnf_invoice-0.0.1.json';
import * as rnf_invoice_0_0_2 from './rnf_invoice/rnf_invoice-0.0.2.json';
import * as rnf_invoice_0_0_3 from './rnf_invoice/rnf_invoice-0.0.3.json';
import * as rnf_generic_0_0_1 from './rnf_invoice/rnf_generic-0.0.1.json';

// Re-export the JSON files structured by format and version.
// NB: A dynamic require (require(`${format}/${format}-${version}.json`)) would prevent tree-shaking
const formats: Record<string, Record<string, any>> = {
  rnf_invoice: {
    '0.0.1': rnf_invoice_0_0_1,
    '0.0.2': rnf_invoice_0_0_2,
    '0.0.3': rnf_invoice_0_0_3,
  },
  rnf_generic: {
    '0.0.1': rnf_generic_0_0_1,
  }
};
export default formats;
