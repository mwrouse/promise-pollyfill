/**
* Represents the state of any promise
*/
enum PromiseStates {
    Pending = 0,
    Fulfilled = 1,
    Rejected = 2
}

var setTimeoutOriginal = setTimeout;

var nothing = function(){}; // Function that does nothing

/**
* Promise Pollyfill class
*/
class PromisePolyfill implements IPromise {
    // Callback functions
    private __subscriptions: IPromiseSubscriptions;


    private __fullfillments: IThenCallback[];
    private __rejections: IThenCallback[];


    private __resolve: Function;
    private __reject: Function;

    public state: PromiseStates;
    public value: any;


    constructor (resolver?: Function)
    {
        if (!PromisePolyfill.isPromise(this))
            throw new TypeError("Promises must be created using the new keyword");

        this.__subscriptions = {
            fulfillments: [],
            rejections: []
        };

        this.__fullfillments = [];
        this.__rejections = [];


        this.state = undefined;
        this.value = null;

        // Call the function specified by the user
        if (resolver && typeof resolver == 'function') {
            this.state = PromiseStates.Pending;

            setTimeoutOriginal( () => {
                try
                {
                    // Call the function passed to constructor
                    resolver((data?: any) => {
                        this.resolve(data);
                    }, (reason?: any) => {
                        this.reject(reason);
                    }, this);
                }
                catch (e) {
                    // Reject with reason of the exception
                    this.reject(e);
                }
            }, 0);

        }
        else {
            throw new TypeError("Promise Resolver " + resolver + " is not a function.");
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
    static race (promises: PromisePolyfill[]): IPromise
    {
        let result: IPromise = new PromisePolyfill((resolve, reject, self) => {
            // Loop through all promises passed (Sub-Promises)
            for (let i = 0; i < promises.length; i++) {
                // Handle non-promises
                if (!PromisePolyfill.isPromise(promises[i])) {
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
    static all (promises: PromisePolyfill[]): IPromise
    {
        let tally: any[] = [];

        let result: IPromise = new PromisePolyfill((resolve, reject, self) => {
            if (promises.length == 0)
                resolve(tally);

            // Loop through all of the promises passed (Sub-Promises)
            for (let i = 0; i < promises.length; i++) {
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
        // Do not allow a promise to be resolved, or rejected more than once
        if (this.isRejected() || this.isFulfilled()) {
            console.warn("Cannot resolve a promise more than once, tried to resolve with data: ", data);
            return this;
        }

        if (PromisePolyfill.isPromise(data)) {
            // Wait for the result to resolve
            data.then((resolvedData) => {
                this.resolve(resolvedData);
            }, (rejectedData) => {
                this.reject(rejectedData);
            });
        }
        else {
            // Update the state and the reason
            this.state = PromiseStates.Fulfilled;
            this.value = data;

            // Perform all the callback functions
            // You have to loop backwards, because if one of the callback functions registers more callbacks and you're
            // Looping through this array forwards then the callback function registered in a callback will occure more than once
            for (let i = this.__fullfillments.length - 1; i >= 0; i--) {
                let fullfillment = this.__fullfillments[i];

                fullfillment.resolveFn();
                //this.__callbacks[i].resolve(this.value);
            }
        }
        return this;

    }


    /**
    * Rejects a promise
    */
    public reject (reason?: any): IPromise
    {
        // Do not allow a promise to be resolved, or rejected more than once
        if (this.isFulfilled() || this.isRejected()) {
            console.warn("Cannot reject a promise more than once, tried to reject with the reason: ", reason);
            return this;
        }

        if (PromisePolyfill.isPromise(reason)) {
            // Wait for the reason to resolve
            reason.then((resolvedData) => {
                this.resolve(resolvedData);
            }, (rejectedData) => {
                this.reject(rejectedData);
            });
        }
        else {
            // Update the state
            this.state = PromiseStates.Rejected;
            this.value = reason;

            // Perform all of the callback functions
            // You have to loop backwards, because if one of the callback functions registers more callbacks and you're
            // Looping through this array forwards then the callback function registered in a callback will occure more than once
            for (let i = this.__fullfillments.length - 1; i >= 0; i--) {
                //this.__callbacks[i].reject(this.value);
                this.__fullfillments[i].rejectFn();
            }

        }

        return this;
    }


    /**
    * Specifies callback functions for resolution and rejections (rejections is optional)
    */
    public then (onResolve?: Function, onRejection?: Function): IPromise
    {
        let fullfillment: IThenCallback = {
            promise: new PromisePolyfill(nothing),
            onResolve: () => undefined,
            onReject: () => undefined,

            resolveFn: nothing,
            rejectFn: nothing
        };

        // Add onResolve
        if (onResolve != undefined && typeof onResolve == 'function') {
            fullfillment.onResolve = onResolve;
        }

        // Add onRejection
        if (onRejection != undefined && typeof onRejection == 'function') {
                fullfillment.onReject = onRejection;
        }


        // Add safe resolve function
        fullfillment.resolveFn = () => {
            try {
                let val = fullfillment.onResolve(this.value);

                if (!fullfillment.promise.isRejected() && !fullfillment.promise.isFulfilled())
                    fullfillment.promise.resolve(val);
            }
            catch (e) {
                if (!fullfillment.promise.isRejected() && !fullfillment.promise.isFulfilled())
                    fullfillment.promise.reject(e);
            }
        };

        // Add safe reject function
        fullfillment.rejectFn = () => {
            try {

                let val = fullfillment.onReject(this.value);

                if (!fullfillment.promise.isRejected() && !fullfillment.promise.isFulfilled())
                    fullfillment.promise.resolve(val);
            }
            catch (e) {
                if (!fullfillment.promise.isRejected() && !fullfillment.promise.isFulfilled())
                    fullfillment.promise.reject(e);
            }
        };

        this.__fullfillments.unshift(fullfillment);

        // Perform callback if already happened


        return fullfillment.promise;
    }

}

// Add the promise onto the window
window['Promise'] = PromisePolyfill;
