YUI Modules Explorer: Automatically discover the required YUI3 modules from JavaScript sources
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

In this case Y.Overlay is used. The required module should be "overlay"

A more complex example might be this one:

```javascript
Y.one('#ac-input').plug(Y.Plugin.AutoComplete, {
	source: ['foo', 'bar', 'baz']
});
```

Here the required module should be "autocomplete-plugin"


The last example:

```javascript
listLinks.plug(
	Y.Plugin.Drop,
	{
		bubbleTargets: '1'
	}
);
```

Here we need "dd-drop-plugin" module.

Resolving the modules
-----------

Resolving the modules is easy - on NodeJS we just use YUI Loader programmatically and we can not only determine the modules, but to generate the full URL.


Status of the project
-----------

It parses the files and resolves some relatively simple cases, like those above. It also is able to determine aliases, constructed by declaring variables.

For example:

```javascript
var YDOM = Y.DOM;
```

and then:

```javascript
test.plug(YDOM.MyModule);
```

will work too.

Methods, directly attached to Y instance will be resolved too. For example:

```javascript
Y.one(...)
```

will match "node-core".

Running the project
-----------

1. Install NodeJS
2. Install esprima (npm install esprima)
3. Install YUI (npm install yui)
4. Install Commander (npm install commander)
4. Run "node js/main.js"

Command line options (view these via node js/main.js -h)
-----------

node js/main.js -h

Usage: main.js [options]

Options:

-f, --file [file name]          The file to parse and extract YUI modules. Defaults to the test file "./test/test.js"

-d, --data [file name]          Path to YUI data.json file. If not specified, "./data/data.json" will be used.

-y, --yui-variable [var1,var2]  The name of the global YUI variable(s). Defaults to Y. Might be single value or an array.

-g, --generate-urls [false]     If specified, generate URLs using YUI Loader

-V, --version                   output the version number