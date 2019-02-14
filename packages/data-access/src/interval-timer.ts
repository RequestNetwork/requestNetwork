/**
 * Module to start and stop a periodical function
 */
export default class IntervalTimer {
  private intervalObject: any = null;
  private intervalFunction: any;
  private intervalTime: number;

  /**
   * Constructor IntervalTimer
   *
   * @param any intervalFunction function to call periodically when timer is started
   * @param number intervalTime Interval time between interval function call
   */
  public constructor(intervalFunction: any, intervalTime: number) {
    this.intervalFunction = intervalFunction;
    this.intervalTime = intervalTime;
  }

  /**
   * Start the interval timer
   */
  public start(): any {
    // Timer can't be restarted
    if (this.intervalObject) {
      throw Error('IntervalTimer already started');
    }

    this.intervalObject = setInterval(this.intervalFunction, this.intervalTime);
  }

  /**
   * Stop the interval timer
   */
  public stop(): any {
    if (!this.intervalObject) {
      throw Error(`Can't stop IntervalTimer if it has not been started`);
    }

    clearInterval(this.intervalObject);
    this.intervalObject = null;
  }
}
