var flatten = require('component-resolver').flatten;

/**
 * Creates bundles in the form of:
 *
 * - boot
 *    |
 *    |-- bundle-user
 *         |
 *         |-- bundle-user-a
 *         |
 *         |-- bundle-user-b
 *         |
 *         |-- bundle-user-c
 *         |
 *         |
 *
 * Where all of `bundle-user-x`s common dependencies
 * are included in `bundle-user`.
 * Each `bundle-user-x` are distinct pages for users.
 * `boot` is a bundle for "visitors".
 * So for visitors, you'll just have:
 *
 *   <script src="boot.js"></script>
 *
 * But for users, you'll have this for a settings page:
 *
 *   <script src="boot.js"></script>
 *   <script src="bundle-user.js"></script>
 *   <script src="bundle-user-settings.js"></script>
 *
 * Note that each `bundle-user-x` is optional here.
 * You can just do `boot` and `bundle-user` for now,
 * then move towards separate user bundles later.
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
  // the second local is always user
  var user = locals.shift();
  // the rest are user bundles
  var bundles = locals;

  return function bundleUserPages(tree) {
    var locals = tree.locals;
    var out = {};

    // bundle everything in boot
    exports[boot] = flatten(locals[boot])
    .map(function (branch) {
      branch.bundle = boot;
      return branch;
    });

    // check each user page
    bundles.forEach(function (name) {
      flatten(locals[name])
      .forEach(function (branch) {
        // already included in boot
        if (branch.bundle === boot) return;
        // already included in user
        if (branch.bundle === user) return;
        branch.bundle = name;
        branch.bundles = branch.bundles || 0;
        // if included in more than one user bundle,
        // just include it in the user bundle.
        if (++branch.bundles > 1) branch.bundle = user;
      });
    });

    // user bundle is now everything not in a bundle
    out[user] = flatten(tree)
    .filter(function (branch) {
      // this bundle
      if (branch.bundle === user) return true;
      // any other bundle
      if (branch.bundle) return false;
      // everything else
      return true;
    });

    // actually export the user bundles
    bundles.forEach(function (name) {
      out[name] = flatten(locals[name])
      .filter(function (branch) {
        return branch.bundle === name;
      });
    });

    return out;
  }
}