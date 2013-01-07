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

This is a weekend project, so don't expect much. Let's call it proof of a concept for now. It parses the files and resolves some relatively simple cases, like those above. It also is able to determine aliases, constructed by declaring variables.

For example:

```javascript
var YDOM = Y.DOM;
```

and then:

```javascript
test.plug(YDOM.MyModule);
```

will work too.

However, more work is needed. We have to parse expression statements, including those of type "CallExpression" and so one.

The above means it currently does not parse methods, directly attached to Y instance. For example:

```javascript
Y.one(...)
```

should match "node-core".

(This shouldn't be hard to achieve).

Running the project
-----------

1. Install NodeJS
2. Install esprima (npm install esprima)
3. Install YUI (npm install yui)
4. Run "node js/main.js"

There will be console output using the test data in test/test.js file

This is everything I have this weekend :)
