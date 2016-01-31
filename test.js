var spawn = require('cross-spawn');
var test = require('tape');

function run(mod, t){
  t.plan(3);

  var stderr = '';
  var stdout = '';

  var ps = spawn('node', [
    '-p',
    'require("./")();require("' + mod + '");"ok"'
  ], {
    stdio: [ 'ignore', 'pipe', 'pipe' ]
  });

  ps.on('error', t.fail.bind(t));
  ps.on('close', function(code, signal){
    if (code !== 0) {
      stderr.split(/[\r\n]+/).forEach(function(line){
        if (line.trim()) t.comment('  ' + line);
      });
    }

    t.is(code, 0, 'exit code is 0');
    t.is(signal, null, 'signal is null');
    t.is(stdout.trim().split(/[\r\n]+/).pop(), 'ok', 'output ok');
  })

  ps.stderr.on('data', function(chunk) {
    stderr+= chunk;
  });

  ps.stdout.on('data', function(chunk) {
    stdout+= chunk;
  });
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
