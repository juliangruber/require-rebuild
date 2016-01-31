var spawnSync = require('cross-spawn').sync;
var extend = require('extend');
var Module = require('module');
var resolveSync = require('resolve').sync;
var dirname = require('path').dirname;
var join = require('path').join;
var relative = require('path').relative;
var sep = require('path').sep;
var extname = require('path').extname;
var home = require('user-home');

var regexes = [
  /Module version mismatch/i, // modern
  /A dynamic link library \(DLL\) initialization routine failed/i, // windows
  /Module did not self-register/i, // modern node requiring a 0.10 module
  /undefined symbol: node_module_register/i, // 0.10 linux
  /Symbol not found: _node_module_register/i // 0.10 osx
];

var gypHome = join(home, '.node-gyp');

module.exports = patch;

function patch(opts){
  var load = Module._load;
  var version = process.versions.node.split('.');
  var isWindows = process.platform === 'win32';
  var isDarwinLegacy = process.platform === 'darwin' && version[0] === '0';

  // Do a pre-test for the special cases.
  // Node 0.10 on Windows segfaults if the native module fails to load.
  // Same if Node 4+ tries to load a 0.10 module.
  // Node 0.10 on OSX doesn't throw an error, but exits with a SIGTRAP.
  if (isWindows || isDarwinLegacy) {
    Module._load = function(request, parent){
      if (extname(request) === '.node') {
        var resolved = resolveRequest(request, parent);
        var root = moduleRoot(resolved);
        if (!visited(root) && shouldRebuild(resolved)) rebuild(root);
      }

      return load.call(Module, request, parent);
    };
  } else {
    Module._load = function(request, parent){
      try {
        return load.call(Module, request, parent);
      } catch (err) {
        if (!isMismatchError(err.message)) throw err;

        var root = moduleRoot(resolveRequest(request, parent));
        if (visited(root)) throw err;

        rebuild(root);
        return load.call(Module, request, parent);
      }
    };
  }

  return require;
}

function shouldRebuild(path){
  // Try to require the native module in a second process.
  // It will still segfault on Windows, but.. fingers crossed?
  var ps = spawnSync('node', [
    '-e',
    'require("' + path.replace(/\\/g, '/') + '")'
  ], {
    cwd: __dirname,
    stdio: [ 'ignore', 'ignore', 'pipe' ]
  });

  if (ps.error) throw ps.error;
  if (ps.status === 0) return false;

  var stderr = ps.stderr.toString();
  if (isMismatchError(stderr)) return true;
  else throw new Error(stderr);
}

function rebuild(root){
  console.error('Recompiling %s...', relative(process.cwd(), root));

  // prebuild or node-gyp
  var pkg = require(join(root, 'package.json'));
  var reg = /prebuild/;
  var prebuild = pkg.scripts
    && (reg.test(pkg.scripts.install) || reg.test(pkg.scripts.prebuild));
  var ps;

  if (prebuild) {
    var bin = join(require.resolve('prebuild'), '../bin.js');
    ps = spawnSync(bin, [
      '--install',
      '--abi=' + process.versions.modules,
      '--target=' + process.versions.node
    ], {
      cwd: root,
      stdio: 'inherit'
    });
  } else {
    ps = spawnSync('node-gyp', [
      'rebuild',
      '--target=' + process.versions.node
    ], {
      cwd: root,
      env: extend(process.env, {
        'HOME': gypHome,
        'USERPROFILE': gypHome
      }),
      stdio: 'inherit'
    });
  }

  if (ps.error) throw ps.error;
  console.error('Done!');
}

function isMismatchError(msg){
  for (var i=0; i < regexes.length; i++) {
    if (regexes[i].test(msg)) return true;
  }
}

function resolveRequest(request, parent){
  return resolveSync(request, {
    basedir: dirname(parent.id),
    extensions: ['.js', '.json', '.node']
  });
}

function visited(root){
  var cache = visited.cache || (visited.cache = {});
  if (cache[root]) return true;
  else cache[root] = true;
}

function moduleRoot(resolved){
  var segs = resolved.split(sep);
  return segs.slice(0, segs.indexOf('node_modules') + 2).join(sep);
}
