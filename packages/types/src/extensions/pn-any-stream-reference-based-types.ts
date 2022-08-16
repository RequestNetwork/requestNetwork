import { PnReferenceBased } from '../extension-types';
export {
  ACTION,
  IAddPaymentAddressParameters,
  IAddRefundAddressParameters,
} from './pn-any-reference-based-types';

/** Parameters for the creation action */
export type ICreationParameters =
  | IMasterRequestCreationParameters
  | ISubsequentRequestCreationParameters;

/** Parameters for the creation action of the first request of a series */
export interface IMasterRequestCreationParameters extends PnReferenceBased.ICreationParameters {
  expectedFlowRate: string;
  expectedStartDate: string;
}

/** Parameters for the creation action of other requests of a series */
export interface ISubsequentRequestCreationParameters
  extends Partial<PnReferenceBased.ICreationParameters> {
  /* requestId of the previous request in the series */
  previousRequestId: string;
  /* requestId of the first request of the series */
  masterRequestId: string;
  /* rank of the request in the series */
  recurrenceNumber: number;
}
