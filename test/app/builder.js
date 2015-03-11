var fs = require('fs');
var path = require('path');

var build = require('component-builder');
var resolve = require('component-resolver');
var mkdir = require('mkdirp');
var bundler = require('../../index');

// create a bundle function of type `.pages`
// based on the `.locals` of a specific `component.json`
var options = {
  root: path.join(__dirname, '.'), // where your main component.json is located
  build: path.join(__dirname, 'build') // component build output
}
var json = require(path.join(options.root, 'component.json'));
var bundle = bundler.pages(json);

mkdir.sync(options.build);

// resolve the dependency tree
// while also installing any remote dependencies
resolve(options.root, {
  install: true
}, function (err, tree) {
  if (err) throw err;

  // create the bundles
  var bundles = bundle(tree);

  // build each bundle
  Object.keys(bundles).forEach(function (name) {
    build.styles(bundles[name])
    .use('styles', build.plugins.css())
    .use('styles', build.plugins.urlRewriter())
    .build(function (err, css) {
      if (err) throw err;
      var file = path.join(options.build, name + '/build.css');
      mkdir.sync(options.build + '/' + name);
      fs.writeFileSync(file, css, 'utf8');
    });
    build.scripts(bundles[name])
    .use('scripts', build.plugins.js())
    .build(function (err, js) {
      if (err) throw err;
      if (name === json.locals[0]) {
        js = build.scripts.require + js; // add require impl to boot component
      }
      var file = path.join(options.build, name + '/build.js');
      mkdir.sync(options.build + '/' + name);
      fs.writeFileSync(file, js, 'utf8');
    });
    build.files(bundles[name], {
        destination: options.build + '/' + name
    })
      .use('images', build.plugins.symlink())
      .use('files', build.plugins.symlink())
      .end();
  });
});
