/**
 * Represents the state of any promise
 */
var PromiseStates;
(function (PromiseStates) {
    PromiseStates[PromiseStates["Pending"] = 0] = "Pending";
    PromiseStates[PromiseStates["Fulfilled"] = 1] = "Fulfilled";
    PromiseStates[PromiseStates["Rejected"] = 2] = "Rejected";
})(PromiseStates || (PromiseStates = {}));
/**
 * Promise Pollyfill class
 */
var Promise = (function () {
    function Promise(resolver) {
        var _this = this;
        this.__subscriptions = {
            fulfillment: [],
            rejection: []
        };
        this.state = undefined;
        this.reason = null;
        // Call the function specified by the user
        if (resolver) {
            this.state = PromiseStates.Pending;
            resolver(function (data) {
                _this.resolve(data);
            }, function (reason) {
                _this.reject(reason);
            }, this);
        }
    }
    /**
     * Methods to check the state
     */
    Promise.prototype.isFullfilled = function () { return this.state == PromiseStates.Fulfilled; };
    Promise.prototype.isRejected = function () { return this.state == PromiseStates.Rejected; };
    Promise.prototype.isPending = function () { return this.state == PromiseStates.Pending; };
    Promise.prototype.getState = function () {
        var states = ["pending", "fulfilled", "rejected"];
        if (this.state == undefined)
            return "undefined";
        return states[this.state];
    };
    /**
     * Runs a function, used for specific cases
     */
    Promise.isPromise = function (toCheck) {
        return (toCheck instanceof Promise);
    };
    /**
     * Static Resolve method
     */
    Promise.resolve = function (data) {
        var result = new Promise(function (resolve, reject) {
            resolve(data);
        });
        return result;
    };
    /**
     * Static reject method
     */
    Promise.reject = function (reason) {
        var result = new Promise(function (resolve, reject) {
            reject(reason);
        });
        return result;
    };
    /**
     * Static method that returns the reason of the first promise to resolve/reject from
     * an array of promises
     */
    Promise.race = function (promises) {
        var result = new Promise(function (resolve, reject, self) {
            // Loop through all promises passed (Sub-Promises)
            for (var i = 0; i < promises.length; i++) {
                // Handle non-promises
                if (!Promise.isPromise(promises[i])) {
                    // Not a promise, immediately resolve
                    resolve(promises[i]);
                    break;
                }
                // Add a subscription to each promise in the array
                promises[i].then(function (data) {
                    // Sub-Promise resolved
                    if (self.isFullfilled() || self.isRejected())
                        return; // PRomise is already finished, don't do anything
                    resolve(data); // First promise to resolve, so resolve result
                }, function (reason) {
                    // Sub-Promise rejected
                    if (self.isFullfilled() || self.isRejected())
                        return; // PRomise is already finished, don't do anything
                    reject(reason); // First promise to reject, so reject result
                });
            }
        });
        return result;
    };
    /**
     * Static method that will return a promise that gets resolved with the value of all the
     * promises in the array, or gets rejected if any of the promises get rejected
     *
     * The result of the promise returned by this function, if all promises passed were fullfilled, will
     * be an array in the order from first resolved to last resolved.
     */
    Promise.all = function (promises) {
        var tally = [];
        var result = new Promise(function (resolve, reject, self) {
            // Loop through all of the promises passed (Sub-Promises)
            for (var i = 0; i < promises.length; i++) {
                // Handle non-promises
                if (!Promise.isPromise(promises[i])) {
                    tally.push(promises[i]); // Add to tally
                    continue; // Move to next promise passed
                }
                // Add subscription to the Sub-Promise
                promises[i].then(function (data) {
                    // Sub-Promise has resolved
                    if (self.isFullfilled() || self.isRejected())
                        return; // PRomise is already finished, don't do anything
                    tally.push(data); // Add to the running tally
                    // Resolve the results promise when all promises have resolved
                    if (tally.length == promises.length)
                        resolve(tally);
                }, function (reason) {
                    // Sub-Promise was rejected
                    if (self.isFullfilled() || self.isRejected())
                        return; // PRomise is already finished, don't do anything
                    reject(reason); // Reject the results promise with the first sub-promise rejected
                });
            }
        });
        return result;
    };
    /**
     * Resolves a promise
     */
    Promise.prototype.resolve = function (data) {
        if (this.isRejected())
            return this;
        // Resolve with the first data to resolve every time
        if (this.isFullfilled() && data != this.reason)
            return this.resolve(this.reason);
        // Update the state and the reason
        this.state = PromiseStates.Fulfilled;
        this.reason = data;
        // Perform all the callback functions
        for (var i = 0; i < this.__subscriptions.fulfillment.length; i++) {
            if (typeof this.__subscriptions.fulfillment[i] == 'function')
                this.__subscriptions.fulfillment[i](this.reason);
        }
        return this;
    };
    /**
     * Rejects a promise
     */
    Promise.prototype.reject = function (reason) {
        if (this.isRejected() || this.isFullfilled())
            return this;
        // Update the state
        this.state = PromiseStates.Rejected;
        this.reason = reason;
        // Perform all of the callback functions
        for (var i = 0; i < this.__subscriptions.rejection.length; i++) {
            if (typeof this.__subscriptions.rejection[i] == 'function')
                this.__subscriptions.rejection[i](this.reason);
        }
        return this;
    };
    /**
     * Specifies callback functions for resolution and rejection (rejection is optional)
     */
    Promise.prototype.then = function (onResolve, onRejection) {
        if (onResolve != undefined && typeof onResolve == 'function')
            this.__subscriptions.fulfillment.push(onResolve);
        if (onRejection != undefined && typeof onRejection == 'function')
            this.__subscriptions.rejection.push(onRejection);
        if (this.isRejected()) {
            this.reject(this.reason);
        }
        else if (this.isFullfilled()) {
            this.resolve(this.reason);
        }
        return this;
    };
    /**
     * Specifics a callback function for rejection
     */
    Promise.prototype.catch = function (onRejection) {
        if (onRejection != undefined && typeof onRejection == 'function')
            this.__subscriptions.rejection.push(onRejection);
        if (this.isRejected()) {
            this.reject(this.reason);
        }
        else if (this.isFullfilled()) {
            this.resolve(this.reason);
        }
        return this;
    };
    return Promise;
}());
