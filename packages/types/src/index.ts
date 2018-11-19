// placeholder interfaces with meaningless content
import * as RequestLogic from './request-logic-type';

export { RequestLogic };

export interface IDataAccess {
  persist: (transaction: string, indexes?: string[]) => string;
  get: (someparam: string) => any[];
}

export interface IStorage {
  add: (someparam: string) => string;
  read: (someparam: string) => string;
}
