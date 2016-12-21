var noop = function(){};

// Tests
var test = new TestyTest("Promise Polyfill"); // This creates a new category

test.AddTest("Polyfill Check", function(assert) {
  var ab = new Promise(noop);

  assert(ab && ab.__subscriptions);
});




/**
 * Basic Features
 */
test = new TestyTest("Basic Features");

// Resolve check
test.AddTest("Resolve", function(assert) {
    var a = new Promise(function(resolve, reject) {
        setTimeout(function(){ resolve(5); }, 3000);
    });

    a.then(function(resolve) { assert(resolve == 5); }, function() { assert(false); });
});

// Reject check
test.AddTest("Reject", function(assert) {
    var a = new Promise(function(resolve, reject) {
        setTimeout(function(){ reject(5); }, 3000);
    });

    a.then(function(d) { assert(false); }, function(d) { assert(d == 5); });
});

// Static promise resolve
test.AddTest("Static Resolve", function(assert) {
    var a = Promise.resolve(8);

    a.then(function(d) {
        assert(d == 8);
    });

});

// Static reject
test.AddTest("Static Reject", function(assert) {
    var prom = Promise.reject(6);

    prom.then(function(d) {
        assert(false);
    }, function(e) {
        assert(e == 6);
    });
});


// Check for typerror
test.AddTest("Non-function Resolver TypeError", function(assert) {
  try
  {
    var a = new Promise(5);
  }
  catch (e) {
    assert(e instanceof TypeError);
  }

  assert(false);
});


// Exception reject
test.AddTest("Exception reject", function(assert) {
    var prom = new Promise(function(resolve, reject) {
        throw new Error("Invalid Stupidity");
    });

    prom.then(function(data) {
        assert(false);
    }, function(data) {
        assert(true);
    });
});


// Resolving a promise with a promise
test.AddTest("Resolve with a promise",function(assert) {
    var prom = new Promise(function(resolve, reject) {
        resolve(new Promise(function(resolve2, reject2) {
            setTimeout(function(){
                resolve2(9);
            }, 1500);
        }));
    });

    prom.then(function(data) {
        assert(data == 9);
    }, function(){
        assert(false);
    });
});


// Thens only called once
test.AddTest("Thens only called once", function(assert) {
    var alreadyResolved = false;

    var prom = new Promise(function(resolve, reject) {
        setTimeout(function(){
            resolve(65);
        }, 1000);
        resolve(9);
    });

    prom.then(function(data) {
        if (alreadyResolved) assert(false);

        alreadyResolved = true;
    });

    setTimeout(function(){
        assert(true);
    }, 5000);
});





/**
 * Then Tests
 */
var test = new TestyTest("Then Tests");

// Check if then returns a promise
test.AddTest("Then returns a promise", function(assert) {
  var prom1 = new Promise(noop);

  var prom2 = prom1.then(noop, noop);

  assert(prom2 instanceof Promise);
});


// Adding then to an already resolved promise
test.AddTest("Then on resolved promise", function(assert) {
    var prom1 = new Promise(function(resolve, reject) { resolve(6); });

    prom1.then(function(data) {
        assert(data == 6);
    }, function() {
        assert(false);
    });
});


// Then promise test
test.AddTest("Chaining Promises", function(assert) {
    var prom1 = new Promise(function(resolve, reject) {
        // Resolve after 1 second
        setTimeout(function(){
            resolve(33);
        }, 1000);
    });

    var prom2 = prom1.then(function(data) {
        if (data == 33) {
            return 99;
        }
        else {
            assert(false); // ?
        }
    }, function(reason) {
        assert(false);
    });

    prom2.then(function(data) {
        assert(data == 99);
    }, function(reason) {
        assert(false);
    });
});


// Then promise test
test.AddTest("Chaining Test 2", function(assert) {
    var prom1 = new Promise(function(resolve, reject) {
        // Resolve after 1 second
        setTimeout(function(){
            resolve(33);
        }, 1000);
    });

    var prom2 = prom1.then();

    prom2.then(function(data) {
        assert(data == undefined);
    }, function(reason) {
        assert(false);
    });
});

// Chaining exception test
test.AddTest("Chaining exception test", function(assert) {
    var prom1 = new Promise(function(resolve, reject) {
        // Resolve after 1 second
        setTimeout(function(){
            resolve(33);
        }, 1000);
    });

    var prom2 = prom1.then(function(data) {
        if (data == 33) {
            throw 9;
        }
        else {
            assert(false); // ?
        }
    }, function(reason) {
        assert(false);
    });

    prom2.then(function(data) {
        assert(false);
    }, function(reason) {
        assert(reason == 9);
    });
});

// Multiple thens
test.AddTest("Multiple Thens", function(assert) {
    var finalProm = new Promise(noop);
    var a1 = a2 = undefined;

    var prom1 = new Promise(function(resolve, reject) {
        // Resolve after 1 second
        setTimeout(function(){
            resolve(9);
        }, 1000);
    });

    prom1.then(function(data) {
        a1 = data;
        // This should execute before a2
        if (a2)
            finalProm.reject();
    }, function() { assert(false); });

    prom1.then(function(data) {
        a2 = data;

        // This should be executed after the other then
        if (a1)
            finalProm.resolve();
        else
            finalProm.reject();

    }, function() { assert(false); });


    finalProm.then(function() {
        assert(a1 == a2 && a1 == 9);
    }, function() {
        assert(false);
    });
});

// Passing non-functions to Then
test.AddTest("Non-functions passed to then", function(assert) {
    var prom = new Promise(function(resolve, reject) {
        setTimeout(function() {
            resolve(9);
        }, 2000);
    });

    try {
        prom.then(8, 8);

        assert(true);
    }
    catch (e) {
        assert(false);
    }
});
