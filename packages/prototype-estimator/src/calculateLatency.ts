import * as fs from 'fs';
import * as readline from 'readline';
import * as simpleStatistics from 'simple-statistics';

/* tslint:disable:no-console */

/**
 * To use the script from package directory:
 * yarn build
 * node dist/calculateLatency.js <path_to_log_file>
 */

// Read the log file
const readlineInterface = readline.createInterface({
  input: fs.createReadStream(process.argv[2]),
});

// Count of getChannelsByTopic request
let getChannelsByTopicCount = 0;

// Count of getTransactionsByChannelId request
let getTransactionsByChannelIdCount = 0;

// Count of persistTransaction request
let persistTransactionCount = 0;

// Array of getChannelsByTopic latency time
let getChannelsByTopicTimes: number[] = [];

// Array of getTransactionsByChannelId latency time
let getTransactionsByChannelIdTimes: number[] = [];

// Array of persistTransaction latency time
let persistTransactionTimes: number[] = [];

/**
 * Get a number between two substring in a string
 *
 * @param str String to search for the number
 * @param str1 First substring
 * @param str2 Second substring
 *
 * @returns Parsed number or null if number not found
 */
const getIntBetween = (str: string, strBefore: string, strAfter: string): number => {
  const subString = str.substring(str.search(strBefore) + strBefore.length, str.search(strAfter));
  return parseInt(subString);
};

// Parses each lines of the log file
readlineInterface.on('line', (line: string) => {
  if (line.includes('#metric')) {
    let time;

    if (line.includes('getChannelsByTopic latency:')) {
      time = getIntBetween(line, 'getChannelsByTopic latency:', 'ms');
      if (time) {
        getChannelsByTopicCount += 1;
        getChannelsByTopicTimes.push(time);
      }
    } else if (line.includes('getTransactionsByChannelId latency:')) {
      time = getIntBetween(line, 'getTransactionsByChannelId latency:', 'ms');
      if (time) {
        getTransactionsByChannelIdCount += 1;
        getTransactionsByChannelIdTimes.push(time);
      }
    } else if (line.includes('persistTransaction latency:')) {
      time = getIntBetween(line, 'persistTransaction latency:', 'ms');
      if (time) {
        persistTransactionCount += 1;
        persistTransactionTimes.push(time);
      }
    }
  }
});

// Computes statistics on the latency
readlineInterface.on('close', () => {
  console.log(
    `${getChannelsByTopicCount +
      getTransactionsByChannelIdCount +
      persistTransactionCount} requests`,
  );
  console.log(`${getChannelsByTopicCount} getChannelsByTopic requests`);
  console.log(`${getTransactionsByChannelIdCount} getTransactionsByChannelId requests`);
  console.log(`${persistTransactionCount} persistTransaction requests`);

  if (getChannelsByTopicCount > 0) {
    console.log(`\ngetChannelsByTopic statistics`);
    console.log(`average: ${simpleStatistics.mean(getChannelsByTopicTimes)}`);
    console.log(`median: ${simpleStatistics.median(getChannelsByTopicTimes)}`);
    console.log(`min: ${simpleStatistics.min(getChannelsByTopicTimes)}`);
    console.log(`max: ${simpleStatistics.max(getChannelsByTopicTimes)}`);
    console.log(
      `standard deviation: ${simpleStatistics.standardDeviation(getChannelsByTopicTimes)}`,
    );
  }
  if (getTransactionsByChannelIdCount > 0) {
    console.log(`\ngetTransactionsByChannelId statistics`);
    console.log(`average: ${simpleStatistics.mean(getTransactionsByChannelIdTimes)}`);
    console.log(`median: ${simpleStatistics.median(getTransactionsByChannelIdTimes)}`);
    console.log(`min: ${simpleStatistics.min(getTransactionsByChannelIdTimes)}`);
    console.log(`max: ${simpleStatistics.max(getTransactionsByChannelIdTimes)}`);
    console.log(
      `standard deviation: ${simpleStatistics.standardDeviation(getTransactionsByChannelIdTimes)}`,
    );
  }
  if (persistTransactionCount > 0) {
    console.log(`\npersistTransaction statistics`);
    console.log(`average: ${simpleStatistics.mean(persistTransactionTimes)}`);
    console.log(`median: ${simpleStatistics.median(persistTransactionTimes)}`);
    console.log(`min: ${simpleStatistics.min(persistTransactionTimes)}`);
    console.log(`max: ${simpleStatistics.max(persistTransactionTimes)}`);
    console.log(
      `standard deviation: ${simpleStatistics.standardDeviation(persistTransactionTimes)}`,
    );
  }
});

/**
 * Example of output:
 * 7535 requests
 * 31 getChannelsByTopic requests
 * 7246 getTransactionsByChannelId requests
 * 258 persistTransaction requests
 *
 * getChannelsByTopic statistics
 * average: 2015.6774193548388
 * median: 1732
 * min: 1438
 * max: 3117
 * standard deviation: 532.769658337403
 *
 * getTransactionsByChannelId statistics
 * average: 1078.8973226607784
 * median: 1011
 * min: 2
 * max: 2644
 * standard deviation: 687.1948485061744
 *
 * persistTransaction statistics
 * average: 64241.69379844961
 * median: 72801
 * min: 12166
 * max: 103925
 * standard deviation: 23110.826690724884
 */
