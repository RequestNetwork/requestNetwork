import { LogTypes } from '@requestnetwork/types';

/**
 * Module to start and stop a periodical function
 */
export default class IntervalTimer {
  // Count the successive number of failure from the interval function
  // This value is used as we may not want to directly log an error if the interval function fails once
  public intervalFunctionSuccessiveFailureCount = 0;

  private readonly intervalFunction: () => Promise<void>;
  private readonly intervalTime: number;
  private readonly logger: LogTypes.ILogger;
  private readonly successiveFailureThreshold: number;
  private timeoutObject: NodeJS.Timeout | null = null;
  private lastRecursion: Promise<void> = Promise.resolve();

  /**
   * Constructor IntervalTimer
   *
   * @param intervalFunction function to call periodically when timer is started
   * @param intervalTime Interval time between interval function call
   * @param logger Logger instance
   * @param successiveFailureThreshold Required number of successive failure from interval function before logging an error
   */
  public constructor(
    intervalFunction: () => Promise<void>,
    intervalTime: number,
    logger: LogTypes.ILogger,
    successiveFailureThreshold = 1,
  ) {
    this.intervalFunction = intervalFunction;
    this.intervalTime = intervalTime;
    this.logger = logger;
    this.successiveFailureThreshold = successiveFailureThreshold;
  }

  /**
   * Start the interval timer
   */
  public start(): void {
    // Timer can't be restarted
    if (this.timeoutObject) {
      throw Error('IntervalTimer already started');
    }

    // Function to be called periodically
    // This function calls and waits for the intervalFunction and sets a timeout
    // to call itself recursively
    const recursiveTimeoutFunction = async (): Promise<void> => {
      try {
        // We wait for the internal function to reset the timeout
        await this.intervalFunction();

        // Reset intervalFunctionSuccessiveFailureCount
        this.intervalFunctionSuccessiveFailureCount = 0;
      } catch (e) {
        // An error in the interval function should not stop the interval timer

        // An isolated error from the interval function is considered as a warning
        this.logger.warn(`${this.intervalFunction.name || 'intervalFunction'} error: ${e}`);

        this.intervalFunctionSuccessiveFailureCount++;

        // If the interval function failed several times in a row, it can be caused by a bigger problem therefore we display an error
        if (this.intervalFunctionSuccessiveFailureCount >= this.successiveFailureThreshold) {
          this.logger.error(
            `${this.intervalFunction.name || 'intervalFunction'} failed ${
              this.intervalFunctionSuccessiveFailureCount
            } times in a row, last error: ${e}`,
          );
        }
      }

      createRecursion();
    };

    const createRecursion = () => {
      this.timeoutObject = setTimeout(() => {
        this.lastRecursion = recursiveTimeoutFunction();
      }, this.intervalTime);
    };

    // First call to the recursive timeout function
    createRecursion();
  }

  /**
   * Stop the interval timer
   */
  public async stop(): Promise<void> {
    if (!this.timeoutObject) {
      return Promise.reject("Can't stop IntervalTimer if it has not been started");
    }

    clearTimeout(this.timeoutObject);
    this.timeoutObject = null;
    return this.lastRecursion;
  }

  public get isStarted(): boolean {
    return Boolean(this.timeoutObject);
  }

  /**
   * Gets current configuration
   *
   * @return the current configuration attributes
   */
  public getConfig(): { intervalTime: number; successiveFailureThreshold: number } {
    return {
      intervalTime: this.intervalTime,
      successiveFailureThreshold: this.successiveFailureThreshold,
    };
  }
}
