var spawnSync = require('cross-spawn').sync;
var extend = require('extend');
var Module = require('module');
var resolveSync = require('resolve').sync;
var dirname = require('path').dirname;
var join = require('path').join;
var relative = require('path').relative;
var sep = require('path').sep;

var mismatchRe = /Module version mismatch/;
var winRe = /A dynamic link library \(DLL\) initialization routine failed/;

module.exports = patch;

function patch(opts){
  var load = Module._load;
  Module._load = function(request, parent){
    var ret;
    try {
      ret = load.call(Module, request, parent);
    } catch (err) {
      if (!mismatchRe.test(err.message) && !winRe.test(err.message)) throw err;

      var resolved = resolveSync(request, {
        basedir: dirname(parent.id),
        extensions: ['.js', '.json', '.node']
      });
      var segs = resolved.split(sep);
      var path = segs.slice(0, segs.indexOf('node_modules') + 2).join(sep);

      console.error('Recompiling %s...', relative(process.cwd(), path));

      // prebuild or node-gyp
      var pkg = require(join(path, 'package.json'));
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
          cwd: path,
          stdio: 'inherit'
        });
      } else {
        ps = spawnSync('node-gyp', [
          'rebuild',
          '--target=' + process.versions.node
        ], {
          cwd: path,
          env: extend(process.env, {
            'HOME': join(process.env.HOME, '.node-gyp')
          }),
          stdio: 'inherit'
        });
      }

      if (ps.error) throw ps.error;
      console.error('Done!');
      return load.call(Module, request, parent);
    }
    return ret;
  };
  return require;
}
