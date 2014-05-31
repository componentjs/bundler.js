var flatten = require('component-resolver').flatten;

/**
 * Creates bundles in the form of:
 *
 * - boot
 *    |
 *    |-- bundle-a
 *    |
 *    |-- bundle-b
 *    |
 *    |-- bundle-c
 *    |
 *    |
 *
 * Where all of `bundle-x`'s common dependencies
 * are included in `boot`.
 * Each `bundle-x` are expected to be distinct pages.
 * Your script tags should look like:
 *
 *   <script src="boot.js"></script>
 *   <script src="bundle-a.js"></script>
 *
 */

module.exports = function (json) {
  if (!json) throw new TypeError('locals required.');
  var locals = Array.isArray(json)
    ? json
    : json.locals;

  if (!locals || locals.length < 2) throw new TypeError('at least two locals are required.');

  // copy
  locals = locals.slice();
  // first local is always boot
  var boot = locals.shift();
  // the rest are just the bundles
  var bundles = locals;

  return function bundlePages(tree) {
    var locals = tree.locals;

    // resolve boot bundles
    flatten(locals[boot])
    .forEach(function (branch) {
      branch.bundle = boot;
    });

    // resolve bundles
    bundles.forEach(function (name) {
      flatten(locals[name])
      .forEach(function (branch) {
        // already included in boot
        if (branch.bundle === boot) return;
        // mark as this bundle, but it's not set in stone yet
        branch.bundle = name;
        // count how many bundles this package is used in
        branch.bundles = branch.bundles || 0;
        // if more than one, move it to boot
        if (++branch.bundles > 1) branch.bundle = boot;
      });
    });

    // actually export the bundles
    var out = {};

    // notice that this twice, we go through the entire tree
    // since it includes shared dependencies
    out[boot] = flatten(tree)
    .filter(function (branch) {
      return branch.bundle === boot;
    });

    // include bundle-specific packages
    bundles.forEach(function (name) {
      out[name] = flatten(locals[name])
      .filter(function (branch) {
        return branch.bundle === name;
      });
    });

    return out;
  }
}
