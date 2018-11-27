// placeholder interfaces with meaningless content
import * as DataAccess from './data-access-types';
import * as Identity from './identity-types';
import * as RequestLogic from './request-logic-types';
import * as Signature from './signature-types';

export { RequestLogic, DataAccess, Signature, Identity };

export interface IStorage {
  append: (data: string) => Promise<string>;
  read: (dataId: string) => Promise<string>;
  getAllDataId: () => Promise<string[]>;
}
