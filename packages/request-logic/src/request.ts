import {
  IdentityTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

import Role from './role';

/**
 * Module to manage a request
 */
export default {
  checkRequest,
  getRoleInRequest,
  pushExtensionsData,
};

/**
 * Function to get the role of an identity in a request
 *
 * @param IIdentity identity the identity to check
 * @param IRequest request the request
 *
 * @returns Types.ROLE the role of the signer (payee, payer or third party)
 */
function getRoleInRequest(identity: IdentityTypes.IIdentity, request: RequestLogicTypes.IRequest): RequestLogicTypes.ROLE {
  return Role.getRole(identity, request);
}

/**
 * Function to check if a request context is valid
 *
 * @param IRequest request the request to check
 *
 * @returns boolean true if the request is valid, throw otherwise
 */
function checkRequest(request: RequestLogicTypes.IRequest): boolean {
  if (!request.version) {
    throw Error('request.version is missing');
  }
  if (!request.currency) {
    throw Error('request.currency is missing');
  }
  if (!request.requestId) {
    throw Error('request.requestId is missing');
  }
  if (!request.state) {
    throw Error('request.state is missing');
  }
  if (!request.creator) {
    throw Error('request.creator is missing');
  }

  if (!request.payee && !request.payer) {
    throw Error('request.payee and request.payer are missing');
  }
  if (request.creator.type !== IdentityTypes.TYPE.ETHEREUM_ADDRESS) {
    throw Error('request.creator.type not supported');
  }
  if (request.payee && request.payee.type !== IdentityTypes.TYPE.ETHEREUM_ADDRESS) {
    throw Error('request.payee.type not supported');
  }
  if (request.payer && request.payer.type !== IdentityTypes.TYPE.ETHEREUM_ADDRESS) {
    throw Error('request.payer.type not supported');
  }
  if (!Utils.amount.isValid(request.expectedAmount)) {
    throw Error('expectedAmount must be a positive integer');
  }
  return true;
}

/**
 * Function to simply add the extensions data to the request
 *
 * @param Types.IRequest requestContext The current request context
 * @param Types.IRequest extensionsData The extensions data to add to the request
 *
 * @returns Types.IRequest The request context with the extensions data added
 */
function pushExtensionsData(
  requestContext: RequestLogicTypes.IRequest,
  extensionsData?: any[],
): RequestLogicTypes.IRequest {
  if (extensionsData) {
    requestContext.extensionsData = (requestContext.extensionsData || []).concat(extensionsData);
  }
  return requestContext;
}
