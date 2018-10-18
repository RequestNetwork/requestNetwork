// placeholder interfaces with meaningless content

export interface IRequestLogic {
  createRequest: (someparam: string) => string;
  acceptRequest: (someparam: string) => string;
}

export interface IDataAccess {
  persist: (someparam: string) => string;
  get: (someparam: string) => string;
}

export interface IStorage {
  add: (someparam: string) => string;
  read: (someparam: string) => string;
}
