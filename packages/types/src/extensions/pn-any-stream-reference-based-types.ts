import { PnReferenceBased } from '../extension-types';
export {
  ACTION,
  IAddPaymentAddressParameters,
  IAddRefundAddressParameters,
} from './pn-any-reference-based-types';

/** Parameters for the creation action */
export interface ICreationParameters extends Partial<PnReferenceBased.ICreationParameters> {
  expectedFlowRate?: string;
  expectedStartDate?: string;
  previousRequestId?: string;
  masterRequestId?: string;
  recurrenceNumber?: number;
}
