import { IdentityTypes, RequestLogicTypes } from 'types/dist';

export interface ICreateCreationActionRequestIdAndTopicsParameters {
  requestParameters: RequestLogicTypes.ICreateParameters;
  signerIdentity: IdentityTypes.IIdentity;
  topics: any[];
}

export interface ICreateCreationActionRequestIdAndTopicsResult {
  action: RequestLogicTypes.IAction;
  hashedTopics: string[];
  requestId: RequestLogicTypes.RequestId;
}
