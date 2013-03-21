'use strict';

var fs = require('fs');

var program = require('commander');

var Y = require('yui').use('oop', 'loader-base');

var FileParser = require('./file-parser');

function list(value) {
    return value.split(',').map(String);
}

var modulesMap = [
    {
        'class': 'AutoCompleteFilters',
        variable: ['AutoComplete']
    },
    {
        'class': 'AutoCompleteFilters',
        variable: ['Plugin', 'AutoComplete']
    }
];

program
  .option('-f, --file [file name]', 'The file to parse and extract YUI modules. Defaults to the test file "./test/test.js"', './test/test.js')
  .option('-d, --dir [directory name]', 'The directory to traverse and extract YUI modules. Defaults to the current folder.', '.')
  .option('-e, --ext [file extensions]', 'The file extensions which should be parsed. Defaults to "js".', 'js')
  .option('-j, --json [file name]', 'Path to YUI data.json file. If not specified, "./data/data.json" will be used.', './data/data.json')
  .option('-y, --yui-variable [var1,var2]', 'The name of the global YUI variable(s). Defaults to Y. Might be single value or an array.', list, ['Y'])
  .option('-g, --generate-urls [false]', 'If specified, generate URLs using YUI Loader', false)
  .version('0.0.3')
  .parse(process.argv);

 var modulesByProperties = [];

 var yuiClasses = [];

program.yuiVariable.forEach(
    function(item, index) {
        yuiClasses[item] = Object.create(null);

        modulesMap.forEach(
            function(globalVar) {
                globalVar.variable.unshift(item);

                modulesByProperties.push(globalVar);
            }
        );
    }
);

modulesMap = null;

function resolveModules(modules) {
    var loader, requiredModules = [];

    modules.forEach(
        function(item, index) {
            requiredModules.push(item.submodule || item.module);
        }
    );

    loader = new Y.Loader(
        {
            combine: true,
            require: requiredModules
        }
    );

    return loader.resolve(true);
}

var data = fs.readFileSync(program.json);

data = JSON.parse(data);

var code = fs.readFileSync(program.file);

var fileParser = new FileParser(
    {
        data: data,
        modulesByProperties: modulesByProperties,
        yuiClasses: yuiClasses
    }
);

var modules = fileParser.parse(code);

console.log('Used modules:\n' + JSON.stringify(modules, null, 4));

if (program.generateUrls) {
    var resolvedModules = resolveModules(modules);

    console.log('Resolved JS modules:\n' + JSON.stringify(resolvedModules.js, null, 4));

    console.log('Resolved CSS modules:\n' + JSON.stringify(resolvedModules.css, null, 4));
}
