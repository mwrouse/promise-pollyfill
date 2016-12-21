var noop = function(){};

// Tests
var test = new TestyTest("Promise Polyfill"); // This creates a new category

test.AddTest("Polyfill Check", function(assert) {
  var ab = new Promise(noop);

  assert(ab && ab.__subscriptions);
});

// Check if then returns a promise
test.AddTest("Then returns a promise", function(assert){
  var prom1 = new Promise(noop);

  var prom2 = prom1.then(noop, noop);

  assert(prom2 instanceof Promise);
});

// Check for typerror
test.AddTest("Non-function Resolver TypeError", function(assert){
  try
  {
    var a = new Promise(5);
  }
  catch (e) {
    assert(e instanceof TypeError);
  }

  assert(false);
});
