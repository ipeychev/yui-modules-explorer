YUI Modules Explorer: Automatically discover the required YUI3 modules from JavaScript source files
========================================

Modules Explorer is a project which tries to save the developer from the monkey job of finding and populating the required YUI modules in JavaScript sources. What it does is to parse the JavaScript files using [esprima](http://esprima.org/) JavaScript parser and to match the used YUI classes to the required modules.

Currently the developers are doing this manually - they look at YUI documentation, use YUI Configurator or copy and paste from the examples. The downsides of this approach are:
* Leads to errors and misconfigurations - it is not easy to determine the right combination of modules and for that reason developers often add wrong modules or they add modules inefficiently. This even happens with the modules inside YUI [for example Dial](http://www.yuiblog.com/blog/2011/07/01/yui-and-loader-changes-for-3-4-0/)
* It is time consuming - determining the right combination of modules requires time

How does this work?
-----------

1. It parses the JavaScript files and looks for YUI Classes.
2. It matches these classes to the modules in which they exists.

Examples:

```javascript
var overlay = new Y.Overlay({
	srcNode: '#myContent',
	visible: false,
	width: '20em'
});
```

In this case Y.Overlay is used. The required module should be "overlay".

##### Resolving modules from values of class attributes:

```javascript
var YP = Y.Plugin;

var YPA = YP.AutoComplete;

Y.one('#ac-input').plug(YPA, {
	resultFilters : ['phraseMatch', 'phraseMatchCase'],
    resultHighlighter: 'phraseMatchCase',
	source: ['foo', 'bar', 'baz']
});
```

The above is a relatively complex example, because we have:

1. Aliases, constructed by declaring variables - "var YP = Y.Plugin;" and "var YPA = YP.AutoComplete;"
2. Some modules should be resolved by matching the values of class **attributes**. In the above example, 'phraseMatch' and 'phraseMatchCase' require "autocomplete-filters" module in addition to "autocomplete-plugin".

Methods, directly attached to Y instance will be resolved too. For example:

```javascript
Y.one(...)
```

will match "node-core".

Running the project
-----------

1. Install NodeJS
2. Install esprima - npm install esprima
3. Install Commander - npm install commander
4. Install findit - npm install findit
5. Run "node js/main.js"

If you run main.js without options, it will print the result of parsing the example file in "test" folder.

Command line options (view these via node js/main.js -h)
-----------

node js/main.js -h

Usage: main.js [options]

Options:

-h, --help                            output usage information

-f, --file [file name]                The file to parse and extract YUI modules.

-d, --dir [directory name]            The directory to traverse and extract YUI modules.

-c, --classes [export classes]        Export class names in addition to modules

-o, --out [file name]                 The ouput file in which the information about found modules should be stored

-e, --ext [file extensions]           The file extensions which should be parsed. Defaults to "js".

-j, --json [file name]                Path to YUI data.json file. If not specified, "./data/data.json" will be used.

-ignode, --ignore-node [node string]  Ignore node string in files. If not speficified, "#!/usr/bin/env node" will be used.

-y, --yui-variable [var1,var2]        The name of the global YUI variable(s). Defaults to Y. Might be single value or an 
array.

-V, --version                         output the version number


Changelog
-----------

ver 0.0.4
- Added option to ignore node string - like "#!/usr/bin/env node"

ver 0.0.3
- Traverse whole directory
- Export modules in file
- Bug fixing

ver 0.0.2
- Resolve modules from class attributes


Current version - 0.0.3
-----------