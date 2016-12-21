/**
 * Represents the state of any promise
 */
enum PromiseStates {
  Pending = 0,
  Fulfilled = 1,
  Rejected = 2
}

var setTimeoutOriginal = setTimeout;

/**
 * Promise Pollyfill class
 */
class PromisePolyfill implements IPromise {
  // Callback functions
  private __subscriptions: IPromiseSubscriptions;

  public state: PromiseStates;
  public reason: any;


  constructor (resolver?: Function)
  {
    if (!(this instanceof PromisePolyfill)) throw new Error("Promises must be created using the new keyword");

    this.__subscriptions = {
        fulfillment: [],
        rejection: []
      };

    this.state = undefined;
    this.reason = null;

    // Call the function specified by the user
    if (resolver && typeof resolver == 'function') {
      this.state = PromiseStates.Pending;

      setTimeoutOriginal( () => {
        // Call the function passed to constructor
        resolver((data?: any) => {
            this.resolve(data);
          }, (reason?: any) => {
            this.reject(reason);
          }, this);
        }, 0);
      
    } else { 
      throw new Error("Promise Resolver " + resolver + " is not a function.");
    }
  }


  /**
   * Methods to check the state
   */
  public isFulfilled (): Boolean { return this.state == PromiseStates.Fulfilled; }
  public isRejected (): Boolean { return this.state == PromiseStates.Rejected; }
  public isPending (): Boolean { return this.state == PromiseStates.Pending; }
  public getState (): string {
    if (this.state == undefined) return "undefined";

    return ["pending", "fulfilled", "rejected"][this.state];
  }


  /**
   * Runs a function, used for specific cases
   */
  static isPromise (toCheck: Object): Boolean {
    return (toCheck instanceof PromisePolyfill);
  }


  /**
   * Static Resolve method
   */
  static resolve (data?: any): IPromise {
      if (PromisePolyfill.isPromise(data)) return data;

      let result: IPromise = new PromisePolyfill((resolve, reject) => {
        resolve(data);
      });

      return result;
  }


  /**
   * Static reject method
   */
  static reject (reason: any): IPromise {
    if (PromisePolyfill.isPromise(reason)) return reason; 
    
    let result: IPromise = new PromisePolyfill((resolve, reject) => {
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
    let result: IPromise = new PromisePolyfill((resolve, reject, self) => {
      // Loop through all promises passed (Sub-Promises)
      for (let i = 0; i < promises.length; i++)
      {
        // Handle non-promises
        if (!PromisePolyfill.isPromise(promises[i]))
        {
            // Not a promise, immediately resolve
            resolve(promises[i]);
            break;
        }

        // Add a subscription to each promise in the array
        promises[i].then((data?: any) => {
          // Sub-Promise resolved
          if (!self.isFulfilled() && !self.isRejected()) {
            resolve(data); // First promise to resolve, so resolve result
          }
        }, (reason?: any) => {
          // Sub-Promise rejected
          if (!self.isFulfilled() && !self.isRejected()) {
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
   * The result of the promise returned by this function, if all promises passed were Fulfilled, will
   * be an array in the order from first resolved to last resolved.
   */
  static all (promises: Promise[]): IPromise
  {
    let tally: any[] = [];

    let result: IPromise = new PromisePolyfill((resolve, reject, self) => {
      if (promises.length == 0) resolve(tally);

      // Loop through all of the promises passed (Sub-Promises)
      for (let i = 0; i < promises.length; i++)
      {
        // Handle non-promises
        if (!PromisePolyfill.isPromise(promises[i]))
        {
          tally.push(promises[i]); // Add to tally
          continue; // Move to next promise passed
        }

        // Add subscription to the Sub-Promise
        promises[i].then((data?: any) => {
          // Sub-Promise has resolved
          if (!self.isFulfilled() && !self.isRejected()) {
            tally.push(data); // Add to the running tally

            // Resolve the results promise when all promises have resolved
            if (tally.length == promises.length)
              resolve(tally);
          }
        }, (reason?: any) => {
          // Sub-Promise was rejected
          if (!self.isFulfilled() && !self.isRejected()) {
            reject(reason); // Reject the results promise with the first sub-promise rejected

            i = promises.length; // Do not continue in for-loop
          }
        });
      } // End for
    });

    return result;
  }


  /**
   * Resolves a promise
   */
  public resolve (data?: any): IPromise
  {
    if (this.isRejected() || this.isFulfilled())
    {
      console.warn("Cannot resolve a promise more than once, tried to resolve with data: ", data);
      return this;
    }
    
    if (PromisePolyfill.isPromise(data)) { 
      data.then((resolvedData) => {
        this.resolve(resolvedData);
      }, (rejectedData) => {
        this.reject(rejectedData);
      });
    }
    else { 
      // Update the state and the reason
      this.state = PromiseStates.Fulfilled;
      this.reason = data;

      // Perform all the callback functions
      // You have to loop backwards, because if one of the callback functions registers more callbacks and you're
      // Looping through this array forwards then the callback function registered in a callback will occure more than once
      for (let i = this.__subscriptions.fulfillment.length - 1; i >= 0; i--)
      {
        if (typeof this.__subscriptions.fulfillment[i] == 'function')
          this.__subscriptions.fulfillment[i](this.reason);
      }
    }
    return this;

  }


  /**
   * Rejects a promise
   */
  public reject (reason?: any): IPromise
  {
    if (this.isFulfilled() || this.isRejected())
    {
      console.warn("Cannot reject a promise more than once, tried to reject with the reason: ", reason);
      return this;
    }
    
    if (PromisePolyfill.isPromise(data)) { 
      data.then((resolvedData) => {
        this.resolve(resolvedData);
      }, (rejectedData) => {
        this.reject(rejectedData);
      });
    }
    else {
      // Update the state
      this.state = PromiseStates.Rejected;
      this.reason = reason;

      // Perform all of the callback functions
      // You have to loop backwards, because if one of the callback functions registers more callbacks and you're
      // Looping through this array forwards then the callback function registered in a callback will occure more than once
      for (let i = this.__subscriptions.rejection.length - 1; i >= 0; i--)
      {
        if (typeof this.__subscriptions.rejection[i] == 'function')
          this.__subscriptions.rejection[i](this.reason);
      }
    }

    return this;
  }


  /**
   * Specifies callback functions for resolution and rejection (rejection is optional)
   */
  public then (onResolve: Function, onRejection?: Function): IPromise
  {
    // Add onResolve
    if (onResolve != undefined && typeof onResolve == 'function' && !this.callbackExists(onResolve))
    {
      this.__subscriptions.fulfillment.push(onResolve);

      if (this.isFulfilled())
      {
        setTimeoutOriginal(() => { onResolve(this.reason); }, 0); // Call the new function if promise has already been resolved
      }

    }

    // Add onRejection
    if (onRejection != undefined && typeof onRejection == 'function' && !this.callbackExists(onRejection, true))
    {
      this.__subscriptions.rejection.push(onRejection);

      if (this.isRejected())
      {
        setTimeoutOriginal(() => { onRejection(this.reason); }, 0); // Call the new function if promise has already been rejected
      }

    }

    return this;
  }


  /**
   * Specifics a callback function for rejection
   */
  public catch (onRejection: Function): IPromise
  {
    return this.then(undefined, onRejection); // Use the .then() function
  }


  /**
   * Tells if a resolve/rejection callback exists, compares functions as strings without any whitespace
   */
  private callbackExists(toCheck: Function, isRejection?: boolean): boolean
  {
     let toCheckAsString = toCheck.toString().replace(/\s+/g, '');

     for(let func in (isRejection) ? this.__subscriptions.rejection : this.__subscriptions.fulfillment)
     {
       if (func.toString().replace(/\s+/g, ' ') == toCheckAsString) return true; // Function exists
     }

     return false; // Function does not exist
  }

}

// Add the promise onto the window
window['Promise'] = PromisePolyfill;
