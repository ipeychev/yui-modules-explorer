'use strict';

var fs = require('fs');

var esprima = require('esprima');

var Traverse = require('./traverse');

var Y = require('yui').use('oop', 'loader-base');

var YObject = Y.Object;

function list(value) {
	return value.split(',').map(String);
}

var program = require('commander');

program
  .version('0.0.2')
  .option('-f, --file [file name]', 'The file to parse and extract YUI modules. Defaults to the test file "./test/test.js"', './test/test.js')
  .option('-d, --data [file name]', 'Path to YUI data.json file. If not specified, "./data/data.json" will be used.', './data/data.json')
  .option('-y, --yui-variable [var1,var2]', 'The name of the global YUI variable(s). Defaults to Y. Might be single value or an array.', list, ['Y'])
  .option('-g, --generate-urls [false]', 'If specified, generate URLs using YUI Loader', false)
  .parse(process.argv);

var code = fs.readFileSync(program.file);

var ast = esprima.parse(code);

var Aliases = Object.create(null);

var YAliases = Object.create(null);

var YUIClasses = Object.create(null);

var ClassesProperties = Object.create(null);

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

var modulesByProperties = [];

program.yuiVariable.forEach(
	function(item, index) {
		YUIClasses[item] = Object.create(null);

		modulesMap.forEach(
			function(globalVar) {
				globalVar.variable.unshift(item);

				modulesByProperties.push(globalVar);
			}
		);
	}
);

modulesMap = null;

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

				addAlias(alias, identifiers, value);

				return Traverse.VisitorOption.Skip;
			}
			else if (node.type === 'ExpressionStatement' && node.expression) {
				processExpressionStatement(node);
			}
			else if (node.type === 'NewExpression') {
				processNewExpression(node);
			}
		},

		leave: function(node, parent) {
		}
	};
}

function addAlias(alias, identifiers, value) {
	if (!Aliases[alias]) {
		Aliases[alias] = {
			identifiers: identifiers,
			value: value
		};
	}

	if (!YUIClasses[alias]) {
		YUIClasses[alias] = value;
	}
}

function addIdentifiers(identifiers) {
	var i, identifierValue, item, mainIdentifier = identifiers[0];

	if (!YUIClasses[mainIdentifier]) {
		return;
	}

	identifierValue = YUIClasses[mainIdentifier];

	for (i = 1; i < identifiers.length; i++) {
		item = identifiers[i];

		if (!identifierValue[item]) {
			identifierValue[item] = {};
		}

		identifierValue = identifierValue[item];
	}

	return identifierValue;
}

function findClassProperties(identifier) {
	var mapClass;

	modulesByProperties.some(
		function(item, index) {
			if(!(item.variable < identifier || identifier < item.variable)) {
				mapClass = item;

				return true;
			}
		}
	);

	return mapClass;
}

function extractPropsAttrbiutes(attrs) {
	var result = {};

	_extractPropsAttrbiutes(attrs, result);

	return result;
}

function explodeAlias(alias) {
	var result = [];

	_explodeAlias(alias, result);

	return result;
}

function getModules(data, classes, modulesFromClassProperties) {
	var modules = _getModules(data, classes);

	modules = mergeYAliases(data, modules);

	modules = modules.concat(modulesFromClassProperties);

	return modules;
}

function mergeYAliases(data, modules) {
	YObject.each(
		data,
		function(value, key) {
			var alias = YAliases[key];

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

function processArrayExpression(node, parent) {
	var elements, result = [];

	if (node.type === 'ArrayExpression') {
		elements = node.elements;

		elements.forEach(
			function(item, index) {
				if (item.type === 'Literal') {
					result.push(item.value);
				}
			}
		);
	}

	return result;
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

function processCallExpression(node, parent) {
	var identifiers;

	if (node.type === 'CallExpression' && node.callee.type === 'MemberExpression') {
		identifiers = processMemberExpression(node.callee, node);
	}

	return identifiers;
}

function processCallExpressionArguments(node, parent) {
	var args = node['arguments'], attrs, explodedIdentifier, identifier;

	if (args.length >= 2) {
		if (args[0].type === 'MemberExpression' && args[1].type === 'ObjectExpression') {
			identifier = processMemberExpression(args[0], node);
		}
		else if (args[0].type === 'Identifier' && args[1].type === 'ObjectExpression') {
			identifier = args[0].name;
		}

		if (identifier) {
			resoveClassesByProperties(identifier, args[1], node);
		}
	}
}

function processExpressionStatement(node) {
	var expression, identifiers;

	expression = node.expression;

	if (expression.type === 'CallExpression') {
		identifiers = processCallExpression(expression, node);

		addIdentifiers(identifiers);

		processCallExpressionArguments(expression, node);
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

function processNewExpression(node, parent) {
	var args = node['arguments'], callee = node.callee, identifier;

	if (callee.type === 'Identifier' && args.length && args[0].type === 'ObjectExpression') {
		identifier = callee.name;
	}
	else if (callee.type === 'MemberExpression' && args.length && args[0].type === 'ObjectExpression') {
		identifier = processMemberExpression(callee, node);
	}

	if (identifier) {
		resoveClassesByProperties(identifier, args[0], node);
	}
}

function processObjectExpression(node, parent) {
	var properties = node.properties, result = [];

	properties.forEach(
		function(item, index) {
			var property = processProperty(item, node);

			result.push(property);
		}
	);

	return result;
}

function processProperty(node, parent) {
	var nodeKey, nodeValue, properties, result = Object.create(null);

	if (node.type === 'Property') {
		nodeKey = node.key;
		nodeValue = node.value;

		if (nodeValue.type === 'Literal' && nodeKey.type === 'Identifier') {
			result[nodeKey.name] = nodeValue.value;
		}
		else if (nodeValue.type === 'ArrayExpression') {
			properties = processArrayExpression(nodeValue, node);

			result[nodeKey.name] = properties;
		}
	}

	return result;
}

function resoveClassesByProperties(identifier, node, parent) {
	var attrs, explodedIdentifier = explodeAlias(identifier), mapClass;

	mapClass = findClassProperties(explodedIdentifier);

	if (mapClass) {
		attrs = processObjectExpression(node, parent);

		ClassesProperties[mapClass['class']] = extractPropsAttrbiutes(attrs);
	}
}

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

function resolveModulesByClassProperties(item, propertiesContainer, modules) {
	var className = item['class'], key, module, properties = propertiesContainer[className];

	if (properties && properties[item.name]) {
		key = className +  ' ' + item.module + ' ' + item.submodule;

		if (!modules[key]) {
			modules[key] = {
				className: className,
				module: item.module,
				submodule: item.submodule
			};
		}
	}
}

function _explodeAlias(alias, result) {
	var data = Aliases[alias];

	if (!data) {
		result.push(alias);

		return;
	}

	data.identifiers.forEach(
		function(item, index) {
			_explodeAlias(item, result);
		}
	);
}

function _extractPropsAttrbiutes(attrs, result) {
	attrs.forEach(
		function(item, index) {
			if (typeof item == 'string') {
				result[item] = 1;
			}
			else {
				YObject.each(
					item,
					function(value, key) {
						if (Array.isArray(value)) {
							_extractPropsAttrbiutes(value, result);
						}
						else {
							result[key] = 1;
						}
					}
				);
			}
		}
	);
}

function _getModules(data, classes, parent) {
	var modules = [];

	YObject.each(
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

			modules = modules.concat(_getModules(value, classes, className));
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

var modulesFromClassProperties = Object.create(null);

dataClassItems.forEach(
	function(item, index) {
		addAlias(item);

		resolveModulesByClassProperties(item, ClassesProperties, modulesFromClassProperties);
	}
);

var modules = getModules(YUIClasses.Y, dataClasses, YObject.values(modulesFromClassProperties));

console.log('Used modules:\n' + JSON.stringify(modules, null, 4));

if (program.generateUrls) {
	var resolvedModules = resolveModules(modules);

	console.log('Resolved JS modules:\n' + JSON.stringify(resolvedModules.js, null, 4));

	console.log('Resolved CSS modules:\n' + JSON.stringify(resolvedModules.css, null, 4));
}
