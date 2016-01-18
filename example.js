// to run this: 
// node example.js
// or
// ./node_modules/.bin/electron example.js

require('./')();
console.log('got module', !!require('frida'));
