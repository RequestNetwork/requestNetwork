import getSizeOfRequest from './size';
import getCreateRequestThroughput from './speed';

// Describes a test case for a benchmark. For example "run speed and size benchmark on the creation of a request with content"
interface TestCase {
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

// The test cases to run
const testCases: TestCase[] = [
  {
    name: 'created',
    case: {
      create: true,
      accept: false,
      increase: false,
      reduce: false,
      content: '',
    },
    benchmarks: {
      size: true,
      speed: true,
    },
  },
  {
    name: 'created + accepted',
    case: {
      create: true,
      accept: true,
      increase: false,
      reduce: false,
      content: '',
    },
    benchmarks: {
      size: true,
      speed: false,
    },
  },
  {
    name: 'created + accepted + increase + reduce',
    case: {
      create: true,
      accept: true,
      increase: true,
      reduce: true,
      content: '',
    },
    benchmarks: {
      size: true,
      speed: false,
    },
  },
];

// Execute all the test cases in parallel and display the results in a table
// tslint:disable:no-floating-promises
// tslint:disable:no-console
Promise.all(
  testCases.map(testCase => {
    // Promise to run the size benchmark on the test case
    const sizeTestPromise = testCase.benchmarks.size
      ? getSizeOfRequest(testCase.case).then(size => ({ size }))
      : Promise.resolve(null);

    // Promise to run the speed benchmark on the test case
    const speedTestPromise = testCase.benchmarks.speed
      ? getCreateRequestThroughput().then(result => ({ countPerSec: result.countPerSec }))
      : Promise.resolve(null);

    // Run the 2 benchmarks and merge their result in an object
    return Promise.all([sizeTestPromise, speedTestPromise]).then(([sizeResult, speedResults]) =>
      Object.assign({ name: testCase.name }, sizeResult, speedResults),
    );
  }),
).then(data => console.table(data));
