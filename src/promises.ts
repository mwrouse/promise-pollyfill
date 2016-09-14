/**
 * Represents the state of any promise
 */
enum PromiseStates {
  Pending = 0,
  Fulfilled = 1,
  Rejected = 2
}


/**
 * Promise Pollyfill class
 */
class Promise implements IPromise {
  // Callback functions
  private __subscriptions: IPromiseSubscriptions;

  public state: PromiseStates;
  public reason: any;


  constructor (resolver?: Function)
  {
    this.__subscriptions = {
        fulfillment: [],
        rejection: []
      };

    this.state = undefined;
    this.reason = null;

    // Call the function specified by the user
    if (resolver)
    {
      this.state = PromiseStates.Pending;

      resolver((data?: any) => {
          this.resolve(data);
        }, (reason?: any) => {
          this.reject(reason);
        }, this);
    }
  }


  /**
   * Methods to check the state
   */
  public isFullfilled (): Boolean { return this.state == PromiseStates.Fulfilled; }
  public isRejected (): Boolean { return this.state == PromiseStates.Rejected; }
  public isPending (): Boolean { return this.state == PromiseStates.Pending; }
  public getState (): string {
    let states: string[] = ["pending", "fulfilled", "rejected"];

    if (this.state == undefined) return "undefined";

    return states[this.state];
  }


  /**
   * Runs a function, used for specific cases
   */
  static isPromise (toCheck: Object): Boolean {
    return (toCheck instanceof Promise);
  }


  /**
   * Static Resolve method
   */
  static resolve (data?: any): IPromise {
      let result: IPromise = new Promise((resolve, reject) => {
        resolve(data);
      });

      return result;
  }


  /**
   * Static reject method
   */
  static reject (reason: any): IPromise {
    let result: IPromise = new Promise((resolve, reject) => {
      reject(reason);
    });

    return result;
  }


  /**
   * Static method that returns the reason of the first promise to resolve/reject from
   * an array of promises
   */
  static race (promises: Promise[]): IPromise
  {
    let result: IPromise = new Promise((resolve, reject, self) => {
      // Loop through all promises passed (Sub-Promises)
      for (let i = 0; i < promises.length; i++)
      {
        // Handle non-promises
        if (!Promise.isPromise(promises[i]))
        {
            // Not a promise, immediately resolve
            resolve(promises[i]);
            break;
        }

        // Add a subscription to each promise in the array
        promises[i].then((data?: any) => {
          // Sub-Promise resolved
          if (!self.isFullfilled() && !self.isRejected()) {
            resolve(data); // First promise to resolve, so resolve result
          }
        }, (reason?: any) => {
          // Sub-Promise rejected
          if (!self.isFullfilled() && !self.isRejected()) {
            reject(reason); // First promise to reject, so reject result

            i = promises.length; // Do not continue in the for-loop
          }
        });
      }

    });

    return result;
  }


  /**
   * Static method that will return a promise that gets resolved with the value of all the
   * promises in the array, or gets rejected if any of the promises get rejected
   *
   * The result of the promise returned by this function, if all promises passed were fullfilled, will
   * be an array in the order from first resolved to last resolved.
   */
  static all (promises: Promise[]): IPromise
  {
    let tally: any[] = [];

    let result: IPromise = new Promise((resolve, reject, self) => {
      // Loop through all of the promises passed (Sub-Promises)
      for (let i = 0; i < promises.length; i++)
      {
        // Handle non-promises
        if (!Promise.isPromise(promises[i]))
        {
          tally.push(promises[i]); // Add to tally
          continue; // Move to next promise passed
        }

        // Add subscription to the Sub-Promise
        promises[i].then((data?: any) => {
          // Sub-Promise has resolved
          if (!self.isFullfilled() && !self.isRejected()) {
            tally.push(data); // Add to the running tally

            // Resolve the results promise when all promises have resolved
            if (tally.length == promises.length)
              resolve(tally);
          }
        }, (reason?: any) => {
          // Sub-Promise was rejected
          if (!self.isFullfilled() && !self.isRejected()) {
            reject(reason); // Reject the results promise with the first sub-promise rejected

            i = promises.length; // Do not continue in for-loop
          }
        });
      }
    });

    return result;
  }


  /**
   * Resolves a promise
   */
  public resolve (data?: any): IPromise
  {
    if (this.isRejected()) return this;

    // Resolve with the first data to resolve every time
    if (this.isFullfilled() && data != this.reason)
      return this.resolve(this.reason);

    // Update the state and the reason
    this.state = PromiseStates.Fulfilled;
    this.reason = data;

    // Perform all the callback functions
    for (let i = 0; i < this.__subscriptions.fulfillment.length; i++)
    {
      if (typeof this.__subscriptions.fulfillment[i] == 'function')
        this.__subscriptions.fulfillment[i](this.reason);
    }

    return this;
  }


  /**
   * Rejects a promise
   */
  public reject (reason?: any): IPromise
  {
    if (this.isFullfilled()) return this;

    // Maintain same reason if it gets rejected more than once
    if (this.isRejected() && reason != this.reason)
      return this.reject(this.reason);

    // Update the state
    this.state = PromiseStates.Rejected;
    this.reason = reason;

    // Perform all of the callback functions
    for (let i = 0; i < this.__subscriptions.rejection.length; i++)
    {
      if (typeof this.__subscriptions.rejection[i] == 'function')
        this.__subscriptions.rejection[i](this.reason);
    }

    return this;
  }


  /**
   * Specifies callback functions for resolution and rejection (rejection is optional)
   */
  public then (onResolve: Function, onRejection?: Function): IPromise
  {
    if (onResolve != undefined && typeof onResolve == 'function') this.__subscriptions.fulfillment.push(onResolve);
    if (onRejection != undefined && typeof onRejection == 'function') this.__subscriptions.rejection.push(onRejection);

    if (this.isRejected()) {
      this.reject(this.reason);
    }
    else if (this.isFullfilled()) {
      this.resolve(this.reason);
    }

    return this;
  }


  /**
   * Specifics a callback function for rejection
   */
  public catch (onRejection: Function): IPromise
  {
    if (onRejection != undefined && typeof onRejection == 'function') this.__subscriptions.rejection.push(onRejection);

    if (this.isRejected()) {
      this.reject(this.reason);
    }
    else if (this.isFullfilled()) {
      this.resolve(this.reason);
    }

    return this;
  }

}


// Add the promise onto the window
window['Promise'] = Promise;
