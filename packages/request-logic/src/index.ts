import { IDataAccess, IRequestLogic } from '@requestnetwork/types';

export class RequestLogic implements IRequestLogic {
  private dataAccess: IDataAccess;
  public constructor(dataAccess: IDataAccess) {
    this.dataAccess = dataAccess;
  }
  public createRequest() {
    return this.dataAccess.persist('1');
  }
  public acceptRequest() {
    return this.dataAccess.persist('2');
  }
}
