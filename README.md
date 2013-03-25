YUI Modules Explorer: Automatically discovers the required YUI3 modules from JavaScript source files
========================================

YUI Modules Explorer (YME) is a project which tries to save the developer from the monkey job of finding and populating the required YUI modules in JavaScript sources. What it does is to parse the JavaScript files using [esprima](http://esprima.org/) JavaScript parser and to match the used YUI classes to the required modules.

Currently the developers are doing this manually - they look at YUI documentation, use YUI Configurator or copy and paste from the examples. The downsides of this approach are:
* Leads to errors and misconfigurations - it is not easy to determine the right combination of modules and for that reason developers often add wrong modules or they add more modules than neeed which only increases the network traffic. This even happens with the modules inside YUI [for example Dial](http://www.yuiblog.com/blog/2011/07/01/yui-and-loader-changes-for-3-4-0/)
* It is time consuming - determining the right combination of modules requires time and efforts

How does YME work?
-----------

1. It parses the JavaScript files and looks for YUI Classes.
2. It matches these classes to the modules in which they exists looking in data.json file, produced by [YUIDoc](http://yui.github.com/yuidoc/args/index.html#working-with-yuidoc-parsed-data).

Examples:

```javascript
var overlay = new Y.Overlay({
	srcNode: '#myContent',
	visible: false,
	width: '20em'
});
```

In this case only one YUI class is used - Y.Overlay. So, he required module should be "overlay".

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

1. Install the module - "npm install -g yme"
5. Run "yme" with some parameters (see below for the list of command line options)

Examples
-----------
This command will parse the whole YUI src folder and will create a file, called "modules.json" with the extracted modules from each JavaScript file:

	$ yme -d ~/projects/yui/yui3/src

The following command will parse only one file:

	$ yme -f demo/demo.js

You can specify more than one file by separating them with commas. See below the command line options for more information

Command line options (view these via yme -h)
-----------

-f, --file [file1,file2] - The file(s) to parse and extract YUI modules.

-d, --dir [directory name] - The directory to traverse and extract YUI modules.

-c, --classes [export classes] - Export class names in addition to modules

-o, --out [file name] - The ouput file in which the information about found modules should be stored

-e, --ext [file extensions] - The file extensions which should be parsed. Defaults to "js".

-j, --json [file name] - Path to YUI data.json file. If not specified, "./data/data.json" will be used.

-i, --ignorenode [node string] - Ignore node string in files. If not speficified, "#!/usr/bin/env node" will be used.

-y, --yui-variable [var1,var2] - The name of the global YUI variable(s). Defaults to Y. Might be single value or an array.

-h, --help - output usage information

-V, --version - output the version number


Changelog
-----------

ver 0.0.5
- Created NPM Package

ver 0.0.4
- Added option to ignore node string - like "#!/usr/bin/env node"

ver 0.0.3
- Traverse whole directory
- Export modules in file
- Bug fixing

ver 0.0.2
- Resolve modules from class attributes


Current version - 0.0.5
-----------