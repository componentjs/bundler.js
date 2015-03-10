# Component Bundler

This is a bundler utility and guide for component. Not all bundling methods will be included in this repo,
but it should help you create your own bundlers. You should know how [builder2](https://github.com/componentjs/builder2.js) works.

You can see two bundlers in [lib/](https://github.com/component/bundler.js/tree/master/lib) for a different directory structures.
Use these included bundles as __instructional examples__ to create your own bundles.
Creating your own bundler tailored for your app will be easier than trying to use one of these bundlers in your app.

## Example

This bundler uses [resolver.js](https://github.com/component/resolver.js) and [builder2](https://github.com/component/builder2.js).
Maybe you need to read how they work.

```js
var fs = require('fs');
var path = require('path');

var build = require('component-builder');
var resolve = require('component-resolver');
var bundler = require('component-bundler');

// create a bundle function of type `.pages`
// based on the `.locals` of a specific `component.json`
var options = {
  root: path.join(__dirname, 'app'), // where your main component.json is located
  build: path.join(__dirname, 'build') // component build output
}
var json = require(path.join(options.root, 'component.json'));
var bundle = bundler.pages(json);

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
    .build(function (err, css) {
      if (err) throw err;
      var file = path.join(options.build, name + '.css');
      fs.writeFileSync(file, css, 'utf8');
    });
    build.scripts(bundles[name])
    .use('scripts', build.plugins.js())
    .build(function (err, js) {
      if (err) throw err;
      if (name === json.locals[0]) {
        js = build.scripts.require + js; // add require impl to boot component
      }
      var file = path.join(options.build, name + '.js');
      fs.writeFileSync(file, js, 'utf8');
    });
  });
})
```

Where your main `app/component.json` looks something like:

```json
{
  "name": "app",
  "paths": ["lib"],
  "locals": ["boot", "page-a", "page-b", "page-c"]
}
```

## API

This is the API for _included_ bundlers.

### var bundle = bundler(json)

This creates a bundler function based on a `component.json` or an array of `locals`. If `json` is an object, it's assumed to be a `component.json`'s `.locals`, otherwise it's the `locals` itself.

Note that some bundlers require `.locals` to be in a specific order.

Note that if you create your own bundler, this step may be unnecessary as you could get the `.locals` differently or could just hardcode the bundle names.

### var bundles = bundle(tree)

`tree` is the dependency tree as retrieved from `component-resolver`. It returns an object of the form `bundles[name] = nodes` where each `nodes` is passed to a separate `build` instances to create bundle-specific builds.

Any custom bundlers _should_ generally have this API.

## How it works

Generally you'll see component apps with the [main component](https://github.com/component/guide/blob/master/creating-apps-with-components/entry-points.md) that looks like:

```json
{
  "name": "app",
  "paths": ["lib"],
  "locals": ["boot"]
}
```

What this generally means is that the entry point is `boot`, not `app`, since `app` itself contains no scripts (i.e. the `index.js`). Thus, client-side, you'll execute `require('./lib/boot')`, not `require('app')` to initialize your app.

Now to create bundles, you simply create more entry points:

```json
{
  "name": "app",
  "paths": ["lib"],
  "locals": ["boot", "bundle-a", "bundle-b", "bundle-c"]
}
```

However, you still `require('./lib/boot.js')` as before. The difference now is that the resolver will now resolve the dependencies of all the bundles in one go. Each bundle is now its own entry point as long as they are not included in another bundle. These "shared dependencies" are included into the **first** component (boot). Thus, to use a bundle, you'll have to include all its dependencies and `require('./lib/bundle-a')` to initialize it.

Remember you can't do `require('app')` as `app` itself contains no scripts.

The included bundlers now split up the dependencies wisely into each bundle depending on how each bundle is dependent on one another. There are an infinite amount of bundling graphs, so only the more commonly used ones are included.

There are cases, where you don't have a boot component (none or multiple). In other words: if your **first** component has scripts that shouldn't be mixed with other bundles.
You can define your `locals` of your main component: `["common", "bundle-a", "bundle-b", "bundle-c"]` and create a file with an empty object (`{}`) at this path `lib/common/component.json`.

It is up to the developer to correctly include script and style tags in the document:

```html
<script src="boot.js"></script>
<script src="bundle-a.js"></script>
```

It is also wise to "autorequire" each build in your bundler script so you don't have to do the following:

```html
<script src="boot.js"></script>
<script src="bundle-a.js"></script>
<script>
  require('./lib/boot');
  require('./lib/bundle-a');
</script>
```

Unless you want to execute each bundle manually.
Note that each component's entry point is its location relative to the first parameter passed to the resolver (`options.root`).
In other words, `./lib/boot` is the `boot` folder located within `lib/`.

## License

The MIT License (MIT)

Copyright (c) 2014 Jonathan Ong me@jongleberry.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
