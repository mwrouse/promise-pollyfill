/**
 * This script runs tests for the promise polyfill
 */
output("Checking the object on the window");

if (window.Promise)
{
  output("\\t- window.Promise exists");

  var ab = new Promise(function(resolve, reject){

  });

  if (ab.__subscriptions)
  {
    output("\\t- Polyfill is working on window.Promise");

    // Run tests
    basic_test(function(){
      race_test(function(){
        all_test();
      })
    });

  }
  else
  {
    output("Promise Polyfill did not take over, all tests failed.");
  }

}



function basic_test(nextTest){
  output("\\nRunning basic test: ");
  output("\\tExpected Output: 42");

  var a = new Promise(function(resolve, reject){
    resolve(42);
  });

  a.then(function(data){
    output("\\tActual output: " + data);
    var result = (data == 42) ? "Success" : "Fail";
    output("\\tTest Result: " + result);

    nextTest();
  });


}



function race_test(nextTest){
  output("\\nRunning race test: ");
  output("\\tExpected Output: 99");

  var a = Promise.race([
    new Promise(function(resolve, reject){
      setTimeout(function(){
        resolve(54);
      }, 1000);
    }),
    new Promise(function(resolve, reject){
      setTimeout(function(){
        resolve(99);
      }, 500);
    }),
    new Promise(function(resolve, reject){
      setTimeout(function(){
        resolve(42);
      }, 750);
    }),
    new Promise(function(resolve, reject){
      setTimeout(function(){
        resolve(66);
      }, 900);
    }),
  ]);

  a.then(function (data) {
    output("\\tActual output: " + data);
    var result = (data == 99) ? "Success" : "Fail";
    output("\\tTest Result: " + result);

    nextTest();
  });


}



function all_test(){
  output("\\nRunning all test: ");
  output("\\tExpected Output: 42,96,74,\"hello\"");

  var a = Promise.all([
    new Promise(function(resolve, reject){
      setTimeout(function(){
        resolve(74);
      }, 300);
    }),
    new Promise(function(resolve, reject){
      setTimeout(function(){
        resolve(96);
      }, 200);
    }),
    new Promise(function(resolve, reject){
      setTimeout(function(){
        resolve("hello");
      }, 400);
    }),
    new Promise(function(resolve, reject){
      setTimeout(function(){
        resolve(42);
      }, 100);
    }),
  ]);

  a.then(function (data) {
    output("\\tActual output: " + data);
    var result = (data.toString() == [42,96,74,"hello"].toString()) ? "Success" : "Fail";
    output("\\tTest Result: " + result);
  });
}




var el = document.getElementById('result');
function output(str) {
  str = str.replace(/\\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
  str = str.replace(/\\n/g, '<br/>');

  result.innerHTML += str + "<br/>";
}
