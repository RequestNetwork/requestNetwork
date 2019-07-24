import * as fs from 'fs';
import * as readline from 'readline';

/* tslint:disable:no-console */

/**
 * To use the script from package directory:
 * yarn build
 * node dist/calculateSuccessRate.js <path_to_log_file>
 */

// Read the log file
const readlineInterface = readline.createInterface({
  input: fs.createReadStream(process.argv[2]),
});

// Count of persistTransaction success
let persistTransactionSuccessCount = 0;

// Count of persistTransaction failure
let persistTransactionFailureCount = 0;

// Parses each lines of the log file
readlineInterface.on('line', (line: string) => {
  if (line.includes('#metric') && line.includes('#successRate')) {

    if (line.includes('persistTransaction successfully completed')) {
      persistTransactionSuccessCount += 1;
    } else if (line.includes('persistTransaction fail')) {
      persistTransactionFailureCount += 1;
    }
  }
});

// Computes statistics on the latency
readlineInterface.on('close', () => {
  const transactionCount = persistTransactionSuccessCount + persistTransactionFailureCount;
  if (transactionCount === 0) {
    console.log(`No transaction done`);
  } else {
    const successRate = (persistTransactionSuccessCount * 100) / (transactionCount);
    console.log(`${transactionCount} transactions done`);
    console.log(`\n${successRate}% transactions successfully done`);
  }
});
