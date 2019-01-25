import getSizeOfRequest from './size';
import getCreateRequestThroughput from './speed';

/**
 * Describes a test case for a benchmark. For example "run speed and size benchmark on the creation of a request with content"
 *
 * @interface ITestCase
 */
export interface ITestCase {
  // Name of the test case
  name: string;

  // What the test tests
  case: {
    // Create a request
    create: boolean;

    // Accept a request
    accept: boolean;

    // Increase the amount a request
    increase: boolean;

    // Reduce the amount a request
    reduce: boolean;

    // Content data
    content: string;
  };

  // Which benchmarks to execute
  benchmarks: {
    size: boolean;
    speed: boolean;
  };
}

/**
 * Results for test case
 *
 * @interface ITestCaseResults
 */
export interface ITestCaseResults {
  // Name of the test case
  name: string;

  // Size of the request for the test case
  size: number;

  // throughput of the test case (in count per seconds)
  countPerSec: number;
}

/**
 * Execute all the test cases in parallel and return the results in a ITestCaseResults array
 *
 * @param {ITestCase[]} testCasesArgument
 * @returns {Promise<ITestCaseResults[]>}
 */
function executeTests(testCasesArgument: ITestCase[]): Promise<ITestCaseResults[]> {
  // Run each test in sequence to avoid running speed benchmarks in parallel and compromising the results
  return testCasesArgument.reduce(
    (previousPromise: Promise<ITestCaseResults[]>, testCase: ITestCase) => {
      return previousPromise.then((previousResults: ITestCaseResults[]) => {
        // Promise to run the size benchmark on the test case
        const sizeTestPromise = testCase.benchmarks.size
          ? getSizeOfRequest(testCase.case).then(size => ({ size }))
          : Promise.resolve(null);

        // Promise to run the speed benchmark on the test case
        const speedTestPromise = testCase.benchmarks.speed
          ? getCreateRequestThroughput(testCase.case).then(result => ({
              countPerSec: result.countPerSec,
            }))
          : Promise.resolve(null);

        // Run the 2 benchmarks and merge their result in an object
        return Promise.all([sizeTestPromise, speedTestPromise]).then(([sizeResult, speedResults]) =>
          previousResults.concat([
            Object.assign({ name: testCase.name }, sizeResult, speedResults),
          ]),
        );
      });
    },
    Promise.resolve([]),
  );
}

export default {
  executeTests,
};
