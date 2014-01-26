var fs = require('fs');
var path = require('path');
var toCamelCase = require('to-camel-case');

fs.readdirSync(path.join(__dirname, 'lib'))
.forEach(function (name) {
  name = name.replace('.js', '');
  exports[toCamelCase(name)] = require('./lib/' + name);
});