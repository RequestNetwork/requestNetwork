import { normalizeKeccak256Hash } from './crypto';

/**
 * Collection of general purpose utility function
 */
export {
  deepCopy,
  deepSort,
  flatten2DimensionsArray,
  getCurrentTimestampInSecond,
  isString,
  timeoutPromise,
  unique,
  uniqueByProperty,
  notNull,
};

const MILLISECOND_IN_SECOND = 1000;

/**
 * Function to check if a variable is a string
 *
 * @param any variable variable to check
 *
 * @returns boolean true, if variable is a string or a String
 */
function isString(variable: any): boolean {
  return typeof variable === 'string' || variable instanceof String;
}

/**
 * Function return a deep copy of the parameter
 *
 * @param any variable variable to copy
 *
 * @returns any the deep copy
 */
function deepCopy<T>(variable: T): T {
  return JSON.parse(JSON.stringify(variable));
}

/**
 * Function return the object with keys deeply sorted
 *
 * @param any nestedObject the object to deeply sort
 *
 * @returns any the object deeply sorted
 */
function deepSort(nestedObject: any): any {
  // sort objects in arrays
  if (nestedObject instanceof Array) {
    return nestedObject.map((i) => deepSort(i));
  }
  // sort data keys
  if (nestedObject instanceof Object) {
    return Object.keys(nestedObject)
      .sort()
      .reduce((sorted: any, key: any) => {
        sorted[key] = deepSort(nestedObject[key]);
        return sorted;
      }, {});
  }
  return nestedObject;
}

/**
 * Separates the duplicated object from an array
 * Two object are assumed identical if their normalized Keccak256 hashes are equal
 * Normalize here is a lowed case JSON stringify of the properties alphabetical sorted
 *
 * @param array the array to curate
 * @returns an object containing the array with only unique element and an object with the duplication
 */
function unique<T>(array: T[]): { uniqueItems: T[]; duplicates: T[] } {
  const result = array.reduce(
    (
      accumulator: { uniqueItems: T[]; duplicates: T[]; uniqueItemsHashes: string[] },
      element: T,
    ) => {
      const hash = normalizeKeccak256Hash(element);

      if (accumulator.uniqueItemsHashes.includes(hash.value)) {
        // if already included, adds it to the array of duplicates
        accumulator.duplicates.push(element);
      } else {
        // if not already included, includes it and reports the hash
        accumulator.uniqueItems.push(element);
        accumulator.uniqueItemsHashes.push(hash.value);
      }
      return accumulator;
    },
    { uniqueItems: [], duplicates: [], uniqueItemsHashes: [] },
  );

  return { uniqueItems: result.uniqueItems, duplicates: result.duplicates };
}

/**
 * Separates the duplicated object from an array from a property
 * Two object are assumed identical if the value of the properties whose name is given in parameter have their normalized Keccak256 hashes equals
 * Normalize here is a lowed case JSON stringify of the properties alphabetical sorted
 *
 * @param array the array to curate
 * @returns an object containing the array with only unique element and an object with the duplication
 */
function uniqueByProperty<T>(array: T[], property: keyof T): { uniqueItems: T[]; duplicates: T[] } {
  const result = array.reduce(
    (
      accumulator: { uniqueItems: T[]; duplicates: T[]; uniqueItemsHashes: string[] },
      element: T,
    ) => {
      const hash = normalizeKeccak256Hash(element[property]);

      if (accumulator.uniqueItemsHashes.includes(hash.value)) {
        // if already included, adds it to the array of duplicates
        accumulator.duplicates.push(element);
      } else {
        // if not already included, includes it and reports the hash
        accumulator.uniqueItems.push(element);
        accumulator.uniqueItemsHashes.push(hash.value);
      }
      return accumulator;
    },
    { uniqueItems: [], duplicates: [], uniqueItemsHashes: [] },
  );

  return { uniqueItems: result.uniqueItems, duplicates: result.duplicates };
}

/**
 * Function return the timestamp in second
 *
 * @returns number current timestamp in second
 */
function getCurrentTimestampInSecond(): number {
  return Math.floor(Date.now() / MILLISECOND_IN_SECOND);
}

/** Function return a two dimensions array flatten
 * @param any[] twoDimensionsArray the array to flatten
 *
 * @returns any[] the flat array
 */
function flatten2DimensionsArray<T>(twoDimensionsArray: T[][]): T[] {
  return twoDimensionsArray.reduce((accumulator, current) => accumulator.concat(current), []);
}

/**
 * Function that returns a promise that rejects when the specified timeout is reached
 * @param timeout Timeout threshold to throw the error
 * @param message Timeout error message
 */
function timeoutPromise<T>(promise: Promise<T>, timeout: number, message: string): Promise<T> {
  const timeoutPromise = new Promise<T>((_resolve, reject): void => {
    setTimeout(() => reject(new Error(message)), timeout);
  });
  return Promise.race<T>([timeoutPromise, promise]);
}

function notNull<T>(x: T | null | undefined): x is T {
  return x !== null && x !== undefined;
}
