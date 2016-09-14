# Promise Polyfill
A simply polyfill to provide the full functionality of ES6 Promises without having ES6 support.



## Use
To use this polyfill, simply include the promise.js file like you would any other script.
```html
<script scr="promises.js"></script>
```
It is that easy, you do not need node or require!


## Basic Use
This is a basic use of a promise:
```javascript
var request = new Promise( function( resolve, reject ) {
  // 5 second delay before resolving the promise
  setTimeout( function() {
    resolve(42);
  }, 5000 );
} );

request.then( function( data ) {
  // First parameter of .then() is a function that executes when the promise is resolved
  console.log( 'Promise was resolved with: ' + data );
}, function ( reason ) {
  // Second parameter of .then() is a function that executes when the promise is rejected
  console.log( 'Promise was rejected with: ' + reason );
} );
```
In this example, when ran, after 5 seconds have passed you will see this in the console:
```
Promise was resolved with: 42
```


## Tests
The tests I have written are dead simply, and just run and display results in the HTML page.


## More Examples
To see more examples of using promises check out the [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise#Examples)
