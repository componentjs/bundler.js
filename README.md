# Component Bundler

This is a bundler utility and guide for component. Not all bundling methods will be included in this repo, but it should help you create your own bundlers.

You can see each bundler in [lib/](https://github.com/component/bundler.js/tree/master/lib).

## Example

This bundler uses [resolver.js](https://github.com/component/resolver.js):

```js
var build = require('component-builder');
var resolve = require('component-resolver');
var bundler = require('component-bundler');

// create a bundle function of type `.pages`
// based on the `.locals` of a specific `component.json`
var bundle = bundler.pages(require('./component.json'));

// resolve the dependency tree
// while also installing any remote dependencies
resolve(process.cwd(), {
  install: true
}, function (err, tree) {
  if (err) throw err;
  
  // create the bundles
  var bundles = bundle(tree);
  
  // build each bundle
  Object.keys(bundles).forEach(function (name) {
    build.styles(bundles[name]).build(function (err, css) {
      // do something with the output
    });
    build.scripts(bundles[name]).build(function (err, js) {
      // do something with the output
    });
  });
})
```

Where your main `component.json` looks something like:

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

Generally you'll see component apps with the main component that looks like:

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

However, you still `require('./lib/boot.js')` as before. The difference now is that the resolver will now resolve the dependencies of all the bundles in one go. Each bundle is now its own entry point as long as they are not included in another bundle. Thus, to use a bundle, you'll have to include all its dependencies and `require('./lib/bundle-a')` to initialize it.

Remember you can't do `require('app')` as `app` itself contains no scripts.

The included bundlers now split up the dependencies wisely into each bundle depending on how each bundle is dependent on one another. There are an infinite amount of bundling graphs, so only the more commonly used ones are included.

It is up to the developer to correctly include script and style tags in the document:

```html
<script src="boot.js"></script>
<script src="bundle-a.js"></script>
```

It is also wise to "autorequire" each build so you don't have to do the following:

```html
<script src="boot.js"></script>
<script src="bundle-a.js"></script>
<script>
  require('./lib/boot'); 
  require('./lib/bundle-a');
</script>
```

Unless you want to execute each bundle manually.
Note that each component's entry point is its location relative to `process.cwd()` without any extensions.
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
