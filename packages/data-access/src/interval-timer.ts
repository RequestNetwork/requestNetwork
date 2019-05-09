/**
 * Module to start and stop a periodical function
 */
export default class IntervalTimer {
  private intervalFunction: any;
  private intervalTime: number;
  private timeoutObject: any = null;

  /**
   * Constructor IntervalTimer
   *
   * @param any intervalFunction function to call periodically when timer is started
   * @param number intervalTime Interval time between interval function call
   */
  public constructor(intervalFunction: () => Promise<void>, intervalTime: number) {
    this.intervalFunction = intervalFunction;
    this.intervalTime = intervalTime;
  }

  /**
   * Start the interval timer
   */
  public start(): any {
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
      } catch (e) {
        // An error in the interval function should not stop the interval timer
        // We display the error and continue the interval timer
        // PROT-181: Implements a log manager
        // tslint:disable-next-line:no-console
        console.log(`intervalTimer error: ${e}`);
      }

      this.timeoutObject = setTimeout(recursiveTimeoutFunction, this.intervalTime);
    };

    // First call to the recursive timeout function
    this.timeoutObject = setTimeout(recursiveTimeoutFunction, this.intervalTime);
  }

  /**
   * Stop the interval timer
   */
  public stop(): any {
    if (!this.timeoutObject) {
      throw Error(`Can't stop IntervalTimer if it has not been started`);
    }

    clearTimeout(this.timeoutObject);
    this.timeoutObject = null;
  }
}
