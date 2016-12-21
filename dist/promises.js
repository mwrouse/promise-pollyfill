/**
 * Represents the state of any promise
 */
var PromiseStates;
(function (PromiseStates) {
    PromiseStates[PromiseStates["Pending"] = 0] = "Pending";
    PromiseStates[PromiseStates["Fulfilled"] = 1] = "Fulfilled";
    PromiseStates[PromiseStates["Rejected"] = 2] = "Rejected";
})(PromiseStates || (PromiseStates = {}));
var setTimeoutOriginal = setTimeout;
/**
 * Promise Pollyfill class
 */
var PromisePolyfill = (function () {
    function PromisePolyfill(resolver) {
        var _this = this;
        if (!(this instanceof PromisePolyfill))
            throw new Error("Promises must be created using the new keyword");
        this.__subscriptions = {
            fulfillment: [],
            rejection: []
        };
        this.state = undefined;
        this.reason = null;
        // Call the function specified by the user
        if (resolver && typeof resolver == 'function') {
            this.state = PromiseStates.Pending;
            setTimeoutOriginal(function () {
                // Call the function passed to constructor
                resolver(function (data) {
                    _this.resolve(data);
                }, function (reason) {
                    _this.reject(reason);
                }, _this);
            }, 0);
        }
        else {
            throw new Error("Promise Resolver " + resolver + " is not a function.");
        }
    }
    /**
     * Methods to check the state
     */
    PromisePolyfill.prototype.isFulfilled = function () { return this.state == PromiseStates.Fulfilled; };
    PromisePolyfill.prototype.isRejected = function () { return this.state == PromiseStates.Rejected; };
    PromisePolyfill.prototype.isPending = function () { return this.state == PromiseStates.Pending; };
    PromisePolyfill.prototype.getState = function () {
        if (this.state == undefined)
            return "undefined";
        return ["pending", "fulfilled", "rejected"][this.state];
    };
    /**
     * Runs a function, used for specific cases
     */
    PromisePolyfill.isPromise = function (toCheck) {
        return (toCheck instanceof PromisePolyfill);
    };
    /**
     * Static Resolve method
     */
    PromisePolyfill.resolve = function (data) {
        if (PromisePolyfill.isPromise(data))
            return data;
        var result = new PromisePolyfill(function (resolve, reject) {
            resolve(data);
        });
        return result;
    };
    /**
     * Static reject method
     */
    PromisePolyfill.reject = function (reason) {
        if (PromisePolyfill.isPromise(reason))
            return reason;
        var result = new PromisePolyfill(function (resolve, reject) {
            reject(reason);
        });
        return result;
    };
    /**
     * Static method that returns the reason of the first promise to resolve/reject from
     * an array of promises
     */
    PromisePolyfill.race = function (promises) {
        var result = new PromisePolyfill(function (resolve, reject, self) {
            var _loop_1 = function (i) {
                // Handle non-promises
                if (!PromisePolyfill.isPromise(promises[i])) {
                    // Not a promise, immediately resolve
                    resolve(promises[i]);
                    return out_i_1 = i, "break";
                }
                // Add a subscription to each promise in the array
                promises[i].then(function (data) {
                    // Sub-Promise resolved
                    if (!self.isFulfilled() && !self.isRejected()) {
                        resolve(data); // First promise to resolve, so resolve result
                    }
                }, function (reason) {
                    // Sub-Promise rejected
                    if (!self.isFulfilled() && !self.isRejected()) {
                        reject(reason); // First promise to reject, so reject result
                        i = promises.length; // Do not continue in the for-loop
                    }
                });
                out_i_1 = i;
            };
            var out_i_1;
            // Loop through all promises passed (Sub-Promises)
            for (var i = 0; i < promises.length; i++) {
                var state_1 = _loop_1(i);
                i = out_i_1;
                if (state_1 === "break")
                    break;
            }
        });
        return result;
    };
    /**
     * Static method that will return a promise that gets resolved with the value of all the
     * promises in the array, or gets rejected if any of the promises get rejected
     *
     * The result of the promise returned by this function, if all promises passed were Fulfilled, will
     * be an array in the order from first resolved to last resolved.
     */
    PromisePolyfill.all = function (promises) {
        var tally = [];
        var result = new PromisePolyfill(function (resolve, reject, self) {
            if (promises.length == 0)
                resolve(tally);
            var _loop_2 = function (i) {
                // Handle non-promises
                if (!PromisePolyfill.isPromise(promises[i])) {
                    tally.push(promises[i]); // Add to tally
                    return out_i_2 = i, "continue";
                }
                // Add subscription to the Sub-Promise
                promises[i].then(function (data) {
                    // Sub-Promise has resolved
                    if (!self.isFulfilled() && !self.isRejected()) {
                        tally.push(data); // Add to the running tally
                        // Resolve the results promise when all promises have resolved
                        if (tally.length == promises.length)
                            resolve(tally);
                    }
                }, function (reason) {
                    // Sub-Promise was rejected
                    if (!self.isFulfilled() && !self.isRejected()) {
                        reject(reason); // Reject the results promise with the first sub-promise rejected
                        i = promises.length; // Do not continue in for-loop
                    }
                });
                out_i_2 = i;
            };
            var out_i_2;
            // Loop through all of the promises passed (Sub-Promises)
            for (var i = 0; i < promises.length; i++) {
                _loop_2(i);
                i = out_i_2;
            } // End for
        });
        return result;
    };
    /**
     * Resolves a promise
     */
    PromisePolyfill.prototype.resolve = function (data) {
        var _this = this;
        if (this.isRejected() || this.isFulfilled()) {
            console.warn("Cannot resolve a promise more than once, tried to resolve with data: ", data);
            return this;
        }
        if (PromisePolyfill.isPromise(data)) {
            data.then(function (resolvedData) {
                _this.resolve(resolvedData);
            }, function (rejectedData) {
                _this.reject(rejectedData);
            });
        }
        else {
            // Update the state and the reason
            this.state = PromiseStates.Fulfilled;
            this.reason = data;
            // Perform all the callback functions
            // You have to loop backwards, because if one of the callback functions registers more callbacks and you're
            // Looping through this array forwards then the callback function registered in a callback will occure more than once
            for (var i = this.__subscriptions.fulfillment.length - 1; i >= 0; i--) {
                if (typeof this.__subscriptions.fulfillment[i] == 'function')
                    this.__subscriptions.fulfillment[i](this.reason);
            }
        }
        return this;
    };
    /**
     * Rejects a promise
     */
    PromisePolyfill.prototype.reject = function (reason) {
        var _this = this;
        if (this.isFulfilled() || this.isRejected()) {
            console.warn("Cannot reject a promise more than once, tried to reject with the reason: ", reason);
            return this;
        }
        if (PromisePolyfill.isPromise(reason)) {
            reason.then(function (resolvedData) {
                _this.resolve(resolvedData);
            }, function (rejectedData) {
                _this.reject(rejectedData);
            });
        }
        else {
            // Update the state
            this.state = PromiseStates.Rejected;
            this.reason = reason;
            // Perform all of the callback functions
            // You have to loop backwards, because if one of the callback functions registers more callbacks and you're
            // Looping through this array forwards then the callback function registered in a callback will occure more than once
            for (var i = this.__subscriptions.rejection.length - 1; i >= 0; i--) {
                if (typeof this.__subscriptions.rejection[i] == 'function')
                    this.__subscriptions.rejection[i](this.reason);
            }
        }
        return this;
    };
    /**
     * Specifies callback functions for resolution and rejection (rejection is optional)
     */
    PromisePolyfill.prototype.then = function (onResolve, onRejection) {
        var _this = this;
        // Add onResolve
        if (onResolve != undefined && typeof onResolve == 'function' && !this.callbackExists(onResolve)) {
            this.__subscriptions.fulfillment.push(onResolve);
            if (this.isFulfilled()) {
                setTimeoutOriginal(function () { onResolve(_this.reason); }, 0); // Call the new function if promise has already been resolved
            }
        }
        // Add onRejection
        if (onRejection != undefined && typeof onRejection == 'function' && !this.callbackExists(onRejection, true)) {
            this.__subscriptions.rejection.push(onRejection);
            if (this.isRejected()) {
                setTimeoutOriginal(function () { onRejection(_this.reason); }, 0); // Call the new function if promise has already been rejected
            }
        }
        return this;
    };
    /**
     * Specifics a callback function for rejection
     */
    PromisePolyfill.prototype.catch = function (onRejection) {
        return this.then(undefined, onRejection); // Use the .then() function
    };
    /**
     * Tells if a resolve/rejection callback exists, compares functions as strings without any whitespace
     */
    PromisePolyfill.prototype.callbackExists = function (toCheck, isRejection) {
        var toCheckAsString = toCheck.toString().replace(/\s+/g, '');
        for (var func in (isRejection) ? this.__subscriptions.rejection : this.__subscriptions.fulfillment) {
            if (func.toString().replace(/\s+/g, ' ') == toCheckAsString)
                return true; // Function exists
        }
        return false; // Function does not exist
    };
    return PromisePolyfill;
}());
// Add the promise onto the window
window['Promise'] = PromisePolyfill;
