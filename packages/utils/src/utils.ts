/**
 * Collection of general purpose utility function
 */
export default {
  deepCopy,
  deepSort,
  getCurrentTimestampInSecond,
  isString,
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
 * Function return the timestamp in second
 *
 * @returns number current timestamp in second
 */
function getCurrentTimestampInSecond(): number {
  return Math.floor(Date.now() / MILLISECOND_IN_SECOND);
}
