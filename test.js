var spawn = require('cross-spawn');
var test = require('tape');

function run(mod, t) {
  t.plan(1);

  var buf = '';
  var ps = spawn('node', [
    '-e',
    'require("./")();require("' + mod + '")'
  ], {
    stdio: [ 'ignore', 'ignore', 'pipe' ]
  });

  ps.on('error', t.fail.bind(t));
  ps.on('close', function(code){
    t.is(code, 0, 'exit code is 0');

    if (code !== 0) {
      buf.split(/[\r\n]+/).forEach(function(line){
        if (line.trim()) t.comment(line);
      });
    }
  })

  ps.stderr.on('data', function(chunk) {
    buf+= chunk;
  })
}

var modules = [
  'a-native-module',
  'a-native-module-without-prebuild',
  'electron-prebuilt'
];

modules.forEach(function(mod){
  test(mod, function(t){
    run(mod, t);
  });
});
