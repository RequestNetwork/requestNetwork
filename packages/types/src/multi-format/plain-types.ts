/** Plain data */
export interface IPlainData {
  // type of the plain
  type: TYPE;
  // the plain data itself
  value: string;
}

/** Supported types */
export enum TYPE {
  PLAIN_TEXT = 'plain-text',
}
