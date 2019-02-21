import crypto from './crypto';

/**
 * Collection of general purpose utility function
 */
export default {
  deepCopy,
  deepSort,
  flatten2DimensionsArray,
  getCurrentTimestampInSecond,
  isString,
  unique,
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
function deepCopy(variable: any): any {
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
    return nestedObject.map(i => deepSort(i));
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
 * Function to separate the duplicated object from an array
 * Two object are assumed identical if their normalized Keccak256 hashes are equal
 * Normalize here is a lowed case JSON stringify of the properties alphabetical sorted
 *
 * @param array the array to curate
 * @returns an object containing the array with only unique element and an object with the duplication
 */
function unique(array: any[]): { uniqueItems: any[]; duplicates: any[] } {
  const result = array.reduce(
    (
      accumulator: { uniqueItems: any[]; duplicates: any[]; uniqueItemsHashes: string[] },
      element: any,
    ) => {
      const hash = crypto.normalizeKeccak256Hash(element);

      if (accumulator.uniqueItemsHashes.includes(hash)) {
        // if already included, adds it to the duplicates array
        accumulator.duplicates.push(element);
      } else {
        // if not already included, includes it and reports the hash
        accumulator.uniqueItems.push(element);
        accumulator.uniqueItemsHashes.push(hash);
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
function flatten2DimensionsArray(twoDimensionsArray: any[]): any[] {
  return twoDimensionsArray.reduce((accumulator, current) => accumulator.concat(current), []);
}
