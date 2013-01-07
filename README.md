modules-explorer
================

Modules Explorer is a project which tries to save the developer from the monkey job of finding and populating the required YUI modules in JavaScript sources. What it does is to parse the JavaScript files using [esprima](http://esprima.org/) JavaScript parser and to match the used YUI classes to the required modules.