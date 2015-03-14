var flatten = require('component-resolver').flatten;
var log = require('debug')('bundler:app:log');

/**
 * Creates bundles in the form of:
 *
 *    |-- bundle-a
 *    |
 *    |-- bundle-b
 *    |
 *    |-- bundle-c
 *    |
 *    |
 *
 * Each `bundle-x` are expected to be distinct pages.
 * Your script tags should look like:
 *
 *   <script src="bundle-a.js"></script>
 *
 */

module.exports = function (json) {
  if (!json) {
    throw new TypeError('locals required.');
  }
  var bundles = Array.isArray(json)
    ? json
    : json.locals;

  // no bundles to build. exit silently
  if (!bundles || bundles.length < 2) return {};

  // copy
  bundles = bundles.slice();

  return function bundleApps(tree) {
    var locals = tree.locals;

    log(locals);

    var out = {};

    bundles.forEach(function (name) {
      var bundleLocals = flatten(locals[name]);

      // copy
      bundleLocals = bundleLocals.slice();

      bundleLocals.forEach(function (local) {
        local.bundle = name;
      });
      // each standalone app contains its own dependencies
      out[name] = bundleLocals;
    });


    return out;
  }
}
