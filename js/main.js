'use strict';

var fs = require('fs');

var esprima = require('esprima');

var Traverse = require('./traverse');

var Y = require('yui').use('oop', 'loader-base');

function list(value) {
	return value.split(',').map(String);
}

var program = require('commander');

program
  .version('0.0.1')
  .option('-f, --file [file name]', 'The file to parse and extract YUI modules. Defaults to the test file "./test/test.js"', './test/test.js')
  .option('-d, --data [file name]', 'Path to YUI data.json file. If not specified, "./data/data.json" will be used.', './data/data.json')
  .option('-y, --yui-variable [var1,var2]', 'The name of the global YUI variable(s). Defaults to Y. Might be single value or an array.', list, ['Y'])
  .option('-g, --generate-urls [false]', 'If specified, generate URLs using YUI Loader', false)
  .parse(process.argv);

var code = fs.readFileSync(program.file);

var ast = esprima.parse(code);

var YUIAliases = {};

var YUIClasses = {};

Y.each(
	program.yuiVariable,
	function(item) {
		YUIClasses[item] = {};
	}
);

var traverse = new Traverse(ast, new Visitor());

function Visitor() {
	var alias, identifiers, value;

	return {
		enter: function(node, parent) {
			if (node.type === 'MemberExpression') {
				identifiers = processMemberExpression(node, parent);

				addIdentifiers(identifiers);

				return Traverse.VisitorOption.Skip;
			}
			else if (node.type === 'VariableDeclarator' && node.init && node.init.type === 'MemberExpression') {
				identifiers = processMemberExpression(node.init, node);

				value = addIdentifiers(identifiers);

				alias = node.id.name;

				addAlias(alias, value);

				return Traverse.VisitorOption.Skip;
			}
			else if (node.type === 'ExpressionStatement' && node.expression) {
				processExpressionStatement(node);
			}
		},

		leave: function(node, parent) {
		}
	};
}

function addAlias(alias, value) {
	if (!YUIClasses[alias]) {
		YUIClasses[alias] = value;
	}
}

function addIdentifiers(identifiers) {
	var mainIdentifier = identifiers[0];

	if (!YUIClasses[mainIdentifier]) {
		return;
	}

	var identifierValue = YUIClasses[mainIdentifier];

	for (var i = 1; i < identifiers.length; i++) {
		var item = identifiers[i];

		if (!identifierValue[item]) {
			identifierValue[item] = {};
		}

		identifierValue = identifierValue[item];
	}

	return identifierValue;
}

function addYUIAliases(classItems) {
	Y.each(
		classItems,
		function(item, index) {
			if (item['class'] === 'YUI') {
				YUIAliases[item.name] = {
					module: item.module,
					submodule: item.submodule
				};
			}
		}
	);
}

function extractModules(data, classes) {
	var modules = _extractModules(data, classes);

	modules = mergeYUIAliases(data, modules);

	return modules;
}

function mergeYUIAliases(data, modules) {
	Y.each(
		data,
		function(value, key) {
			var alias = YUIAliases[key];

			if (alias) {
				modules.push(
					{
						className: 'YUI',
						module: alias.module,
						submodule: alias.submodule
					}
				);
			}
		}
	);

	return modules;
}

function processAssignmentExpression(node, parent) {
	var leftExpression, rightIdentifier, rightStatement;

	rightStatement = node.right;

	if (rightStatement.type === 'Identifier') {
		rightIdentifier = rightStatement.name;

		if (rightIdentifier) {
			leftExpression = node.left;

			if (leftExpression.type === 'Identifier') {
				YUIClasses[leftExpression.name] = YUIClasses[rightIdentifier];
			}
		}
	}
}

function processExpressionStatement(node) {
	var expression, identifiers;

	expression = node.expression;

	if (expression.type === 'CallExpression') {
		identifiers = processCallExpression(expression, node);

		addIdentifiers(identifiers);
	}
	else if (expression.type === 'AssignmentExpression' && expression.operator === '=') {
		processAssignmentExpression(expression, node);
	}
}

function processMemberExpression(node, parent) {
	var identifiers = [];

	_processMemberExpression(node, parent, identifiers);

	return identifiers;
}

function processCallExpression(node, parent) {
	var identifiers;

	if (node.type === 'CallExpression' && node.callee.type === 'MemberExpression') {
		identifiers = processMemberExpression(node.callee, node);
	}

	return identifiers;
}

function resolveModules(modules) {
	var requiredModules = [];

	modules = Y.each(
		modules,
		function(item, index) {
			requiredModules.push(item.submodule || item.module);
		}
	);

	var loader = new Y.Loader(
		{
			combine: true,
			require: requiredModules
		}
	);

	return loader.resolve(true);
}

function _extractModules(data, classes, parent) {
	var modules = [];

	Y.each(
		data,
		function(value, key, obj) {
			var className = (parent ? parent + '.' : '') + key;

			if (classes[className]) {
				modules.push(
					{
						className: className,
						module: classes[className].module,
						submodule: classes[className].submodule
					}
				);
			}

			modules = modules.concat(_extractModules(value, classes, className));
		}
	);

	return modules;
}

function _processMemberExpression(node, parent, identifiers) {
	if (node.type === 'MemberExpression') {
		_processMemberExpression(node.object, node, identifiers);

		_processMemberExpression(node.property, node, identifiers);
	}
	else if (node.type === 'Identifier') {
		identifiers.push(node.name);
	}
}

var data = fs.readFileSync(program.data);

data = JSON.parse(data);

var dataClasses = data.classes;

var dataClassItems = data.classitems;

addYUIAliases(dataClassItems);

var modules = extractModules(YUIClasses.Y, dataClasses);

console.log('Used modules:\n' + JSON.stringify(modules, null, 4));

if (program.generateUrls) {
	var resolvedModules = resolveModules(modules);

	console.log('Resolved JS modules:\n' + JSON.stringify(resolvedModules.js, null, 4));

	console.log('Resolved CSS modules:\n' + JSON.stringify(resolvedModules.css, null, 4));
}
