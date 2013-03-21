'use strict';

var fs = require('fs');

var walk = require('walkdir');

var program = require('commander');

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
  .option('-f, --file [file name]', 'The file to parse and extract YUI modules.', list)
  .option('-d, --dir [directory name]', 'The directory to traverse and extract YUI modules. Defaults to the current folder.', '.')
  .option('-c, --classes [export classes]', 'Export class names in addition to modules', true)
  .option('-o, --out [file name]', 'The ouput file in which the information about found modules should be stored', 'modules.json')
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

var data = fs.readFileSync(program.json);

data = JSON.parse(data);

var stream = fs.createWriteStream(
    program.out,
    {
        encoding: 'utf8'
    }
);

stream.once(
    'open',
    function(fd) {
        stream.write('{\n');

        process.on(
            'exit',
            function() {
                stream.write('}\n');

                stream.end();
            }
        );
    }
);

// 1. Extract modules from all passed files

var fileParser = new FileParser(
    {
        data: data,
        modulesByProperties: modulesByProperties,
        yuiClasses: yuiClasses
    }
);

var passed;

var indent = new Array(5).join(' ');
var indent2x = indent + indent;

program.file.forEach(
    function(fileName) {
        fs.readFile(
            fileName,
            function(err, content) {
                if (err) {
                    console.log('Cannot read file: ' + program.file + '. Reason: ' + err);

                    return;
                }

                var modules = fileParser.parse(content);

                if (passed) {
                    stream.write(',');
                }

                stream.write(indent + '"' + fileName + '": {\n');

                var classes = '';
                var moduleNames = '';

                modules.forEach(
                    function(module) {
                        if (program.classes) {
                            if (classes) {
                                classes += ', ';
                            }

                            classes += module.className;
                        }

                        if (moduleNames) {
                            moduleNames += ', ';
                        }

                        moduleNames += module.submodule ? module.submodule : module.module;
                    }
                );

                if (program.classes) {
                    stream.write(indent2x + '"classes": "' + classes + '",\n');
                }

                stream.write(indent2x + '"modules": "' + moduleNames + '"\n' + indent + '}\n');

                passed = true;
            }
        );
    }
);