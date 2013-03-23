'use strict';

var fs = require('fs');

var program = require('commander');

var FileParser = require('./file-parser');

var OutputWriter = require('./output');

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
  .option('-d, --dir [directory name]', 'The directory to traverse and extract YUI modules.')
  .option('-c, --classes [export classes]', 'Export class names in addition to modules', true)
  .option('-o, --out [file name]', 'The ouput file in which the information about found modules should be stored', 'modules.json')
  .option('-e, --ext [file extensions]', 'The file extensions which should be parsed. Defaults to "js".', 'js')
  .option('-j, --json [file name]', 'Path to YUI data.json file. If not specified, "./data/data.json" will be used.', './data/data.json')
  .option('-i, --ignorenode [node string]', 'Ignore node string in files. If not speficified, "#!/usr/bin/env node" will be used.', '#!/usr/bin/env node')
  .option('-y, --yui-variable [var1,var2]', 'The name of the global YUI variable(s). Defaults to Y. Might be single value or an array.', list, ['Y'])
  .version('0.0.3')
  .parse(process.argv);

if (!program.file && !program.dir) {
    console.log('Come on, give me a chance and specify at least one file (-f) or a directory (-d)!');

    process.exit();
}

var modulesByProperties = [];
var yuiClasses = [];
var totalFileCounter = 0;
var parsedFileCounter = 0;
var failedFileCounter = 0;

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

console.log('Preparing YUI JSON file: ' + program.json);

var data = fs.readFileSync(program.json);

data = JSON.parse(data);

var yuiAliases = Object.create(null);

(function addYUIAliases(classitems) {
    classitems.forEach(
        function(item, index) {
            if (item['class'] === 'YUI') {
                yuiAliases[item.name] = {
                    module: item.module,
                    submodule: item.submodule
                };
            }
        }
    );
}(data.classitems));

var fileParser = new FileParser(
    {
        data: data,
        modulesByProperties: modulesByProperties,
        yuiAliases: yuiAliases,
        yuiClasses: yuiClasses
    }
);

console.log('Opening output stream: ' + program.out);

var stream = fs.createWriteStream(
    program.out,
    {
        encoding: 'utf8'
    }
);

stream.once(
    'open',
    function(fd) {
        outputWriter.writeStart();

        process.on(
            'exit',
            function() {
                outputWriter.writeEnd();

                stream.end();

                function getSuffix(counter) {
                    return counter > 1 ? 's' : '';
                }

                console.log(
                    'Successfully parsed: ' + parsedFileCounter + ' file' + getSuffix(parsedFileCounter) + '\n' +
                    'Failed: ' + failedFileCounter + ' files\n' +
                    'Total: ' + totalFileCounter + ' file' + getSuffix(totalFileCounter)
                );
            }
        );
    }
);

var outputWriter = new OutputWriter(
    {
        classes: program.classes,
        stream: stream
    }
);

fileParser.on(
    'success',
    function(modules, data) {
        ++parsedFileCounter;

        outputWriter.write(modules, data);

        console.log('Parsed ' + data.name);
    }
);

fileParser.on(
    'failure',
    function(data) {
        ++failedFileCounter;

        console.log('Failed ' + data.name);
    }
);

function extractFileModules(fileName) {
    fs.readFile(
        fileName,
        function(err, content) {
            ++totalFileCounter;

            if (err) {
                console.log('Cannot read file: ' + fileName + '.\n' + err);

                return;
            }

            content = content.toString();

            if (content.indexOf(program.ignorenode) === 0) {
                content = content.substring(program.ignorenode.length);
            }

            fileParser.parse(
                content,
                {
                    name: fileName
                }
            );
        }
    );
}

// 1. Extract modules from all passed files
if (program.file) {
    console.log('Parsing files: ' + program.file);

    program.file.forEach(extractFileModules);
}

// 2. Walk through the directory and extract modules from all files, which extensions match
if (program.dir) {
    console.log('Parsing directory: ' + program.dir);

    var finder = require('findit').find(program.dir);

    finder.on(
        'file',
        function (file, stat) {
            var fileExt = file.substr(file.lastIndexOf('.') + 1);

            if (program.ext.indexOf(fileExt.toLowerCase()) >= 0) {
                extractFileModules(file);
            }
        }
    );
}