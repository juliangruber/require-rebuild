// to run this: 
// node example.js
// or
// ./node_modules/.bin/electron example.js

require('./')();
require('frida');
require('a-native-module');
require('a-native-module-without-prebuild');
require('nsq.js');

console.log('all good!');
