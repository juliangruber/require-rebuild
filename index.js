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

var mismatchRe = /Module version mismatch/;
var winRe = /A dynamic link library \(DLL\) initialization routine failed/;
var legacyRe = /undefined symbol: node_module_register/;
var gypHome = join(home, '.node-gyp');

module.exports = patch;

function patch(opts){
  var load = Module._load;
  var version = process.versions.node.split('.');

  // node 0.10 segfaults if the native module fails to load
  if (version[0] === '0' && version[1] === '10' && false) {
    Module._load = function(request, parent){
      if (extname(request) === '.node') {
        var resolved = resolveRequest(request, parent);
        if (shouldRebuild(resolved)) rebuild(resolved);
      }

      return load.call(Module, request, parent);
    };
  } else {
    Module._load = function(request, parent){
      try {
        return load.call(Module, request, parent);
      } catch (err) {
        if (!isMismatchError(err.message)) throw err;
        rebuild(resolveRequest(request, parent));
        return load.call(Module, request, parent);
      }
    };
  }

  return require;
}

function shouldRebuild(path) {
  // Try to require the native module in a second process.
  // It will still segfault, but.. fingers crossed?
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

function rebuild(path) {
  var segs = path.split(sep);
  var root = segs.slice(0, segs.indexOf('node_modules') + 2).join(sep);

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

function isMismatchError(msg) {
  return mismatchRe.test(msg) || winRe.test(msg) || legacyRe.test(msg);
}

function resolveRequest(request, parent) {
  return resolveSync(request, {
    basedir: dirname(parent.id),
    extensions: ['.js', '.json', '.node']
  });
}
