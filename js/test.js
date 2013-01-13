"use strict";

var fs = require('fs');

var escodegen = require('escodegen');

var esprima = require('esprima');

var code = fs.readFileSync('./test/test.js');

var ast = esprima.parse(code);

console.log(JSON.stringify(ast, null, 4));

escodegen.traverse(ast, new Visitor());

function Visitor() {
	var identifiers;

	return {
		enter: function(node, parent) {
			if (node.type === 'MemberExpression') {
				debugger;
				identifiers = processMemberExpression(node, parent);

				console.log(JSON.stringify(identifiers, null, 4));

				return 2; // skip
			}
			else if (node.type === 'VariableDeclarator' && node.init && node.init.type === 'MemberExpression') {
				identifiers = processMemberExpression(node.init, node);

				var alias = node.id.name;

				console.log('Alias: ' + alias);

				console.log('identifiers: ' + JSON.stringify(identifiers, null, 4));

				return 2;
			}
			else if (node.type === 'ExpressionStatement' && node.expression && node.expression.type === 'CallExpression') {
				identifiers = processCallExpression(node.expression, node);

				console.log('Call expression: ' + JSON.stringify(identifiers, null, 4));
			}
		},

		leave: function(node, parent) {

		}
	};
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

function processMemberExpression(node, parent) {
	var identifiers = [];

	_processMemberExpression(node, parent, identifiers);

	return identifiers;
}


function processCallExpression(node, parent) {
	if (node.type === 'CallExpression' && node.callee.type === 'MemberExpression') {
		var identifiers = processMemberExpression(node.callee, node);

		debugger;
	}

	return identifiers;
}