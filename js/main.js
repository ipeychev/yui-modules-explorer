/*global Y,YUI*/

"use strict";

var esprima = require('esprima');

var fs = require('fs');

var code = fs.readFileSync('./test/test.js');

var ast = esprima.parse(code);

console.log(JSON.stringify(ast, null, 4));

var Y = require('yui').use('oop', 'loader-base');

var identifiers = {
	Y: {}
};

var Lang = Y.Lang;

var YObject = Y.Object;

Y.each(
	ast.body,
	function processsItem(item) {
		YObject.each(
			item,
			function (value, key, processedItem) {
				if (value === 'MemberExpression') {
					processMemberExpression(processedItem);
				} else if (value === 'ExpressionStatement') {
					processExpressionStatement(processedItem);
				} else if (value === 'VariableDeclaration') {
					processVariableDeclaration(processedItem);
				} else if (Lang.isObject(value) || Lang.isArray(value)) {
					processsItem(value);
				}
			}
		);
	}
);

function addProperty(prop, curPath) {
	if (prop) {
		var identifier = prop.name || prop.value;

		if (!curPath[identifier]) {
			curPath[identifier] = {};
		}

		return curPath[identifier];
	}

	return null;
}

function extractModules(data, classes, parent) {
	var modules = [];

	Y.each(
		data,
		function (value, key, obj) {
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

			var modules2 = extractModules(value, classes, className);

			modules = modules.concat(modules2);
		}
	);

	return modules;
}

function getValidIdentifier(obj) {
	var hasOwnProp = Object.prototype.hasOwnProperty;

	for (var item in identifiers) {
		if (hasOwnProp.call(identifiers, item)) {
			if (item === obj.name && obj.type === 'Identifier') {
				return item;
			}
		}
	}

	return false;
}

function processAssignmentExpression(expression) {
	var leftExpression, rightIdentifier, rightStatement;

	rightStatement = expression.right;

	if (rightStatement.type === 'Identifier') {
		rightIdentifier = getValidIdentifier(rightStatement);

		if (rightIdentifier && rightIdentifier !== 'Y') {
			leftExpression = expression.left;

			if (leftExpression.type === 'Identifier') {
				identifiers[leftExpression.name] = identifiers[rightIdentifier];
			}
		}
	}
}

function processExpressionStatement(item) {
	var expression;

	expression = item.expression;

	if (expression.type === 'AssignmentExpression' && expression.operator === '=') {
		processAssignmentExpression(item.expression);
	}
}

function processMemberExpression(item) {
	var identifier, obj, out, prop, result;

	debugger;

	out = {
		identifier: null
	};

	result = _processMemberExpression(item, out);

	return out;
}

function processVariableDeclaration(item) {
	var identifier, init, result;

	Y.each(
		item.declarations,
		function (item, index, obj) {
			if (item.type === 'VariableDeclarator') {
				init = item.init;

				if (init && init.type === 'MemberExpression') {
					processMemberExpression(init);
				}
			}
		}
	);
}

function _processMemberExpression(item, out) {
	var identifier, obj, prop, result;

	debugger;

	obj = item.object;
	prop = item.property;

	if (Lang.isObject(obj) && obj.type === 'MemberExpression') {
		result = _processMemberExpression(obj, out);

		result = addProperty(prop, result);
	} else {
		identifier = getValidIdentifier(obj);

		if (identifier) {
			result = addProperty(prop, identifiers[identifier]);

			out.identifier = {
				name: identifier,
				value: result
			};
		}
	}

	return result;
}

function resolveModules(modules) {
	var requiredModules = [];

	modules = Y.each(
		modules,
		function (item, index) {
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

console.log(JSON.stringify(identifiers, null, 4));

var data = fs.readFileSync('data/data.json');

data = JSON.parse(data);

var classes = data.classes;

var modules = extractModules(identifiers.Y, classes);

console.log(JSON.stringify(modules, null, 4));

var resolvedModules = resolveModules(modules);

console.log('Resolved JS modules:\n' + JSON.stringify(resolvedModules.js, null, 4));

console.log('Resolved CSS modules:\n' + JSON.stringify(resolvedModules.css, null, 4));