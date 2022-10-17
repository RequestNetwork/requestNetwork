import { PaymentReferenceCalculator } from '@requestnetwork/payment-detection';

import Request from './api/request';
import Utils from './api/utils';
import { default as RequestNetwork } from './http-request-network';
import { default as RequestNetworkBase } from './api/request-network';
import { default as HttpMetaMaskDataAccess } from './http-metamask-data-access';
import * as Types from './types';

export {
  PaymentReferenceCalculator,
  Request,
  RequestNetwork,
  RequestNetworkBase,
  HttpMetaMaskDataAccess,
  Types,
  Utils,
};
