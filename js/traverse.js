/**
 * Traverse was borrowed from escodegen
 * BSD license
 */

'use strict';

var VisitorKeys = {
	ArrayExpression: ['elements'],
	ArrayPattern: ['elements'],
	AssignmentExpression: ['left', 'right'],
	BinaryExpression: ['left', 'right'],
	BlockStatement: ['body'],
	BreakStatement: ['label'],
	CallExpression: ['callee', 'arguments'],
	CatchClause: ['param', 'body'],
	ConditionalExpression: ['test', 'consequent', 'alternate'],
	ContinueStatement: ['label'],
	DebuggerStatement: [],
	DirectiveStatement: [],
	DoWhileStatement: ['body', 'test'],
	EmptyStatement: [],
	ExpressionStatement: ['expression'],
	ForInStatement: ['left', 'right', 'body'],
	ForStatement: ['init', 'test', 'update', 'body'],
	FunctionDeclaration: ['id', 'params', 'body'],
	FunctionExpression: ['id', 'params', 'body'],
	Identifier: [],
	IfStatement: ['test', 'consequent', 'alternate'],
	LabeledStatement: ['label', 'body'],
	Literal: [],
	LogicalExpression: ['left', 'right'],
	MemberExpression: ['object', 'property'],
	NewExpression: ['callee', 'arguments'],
	ObjectExpression: ['properties'],
	ObjectPattern: ['properties'],
	Program: ['body'],
	Property: ['key', 'value'],
	ReturnStatement: ['argument'],
	SequenceExpression: ['expressions'],
	SwitchCase: ['test', 'consequent'],
	SwitchStatement: ['discriminant', 'cases'],
	ThisExpression: [],
	ThrowStatement: ['argument'],
	TryStatement: ['block', 'handlers', 'finalizer'],
	UnaryExpression: ['argument'],
	UpdateExpression: ['argument'],
	VariableDeclaration: ['declarations'],
	VariableDeclarator: ['id', 'init'],
	WhileStatement: ['test', 'body'],
	WithStatement: ['object', 'body'],
	YieldExpression: ['argument']
};

var isArray = Array.isArray || function isArray(array) {
	return Object.prototype.toString.call(array) === '[object Array]';
};

var VisitorOption = {
	Break: 1,
	Skip: 2
};

function Traverse (top, visitor) {
	var worklist, leavelist, node, ret, current, current2, candidates, candidate, marker = {};

	worklist = [ top ];
	leavelist = [ null ];

	while (worklist.length) {
		node = worklist.pop();

		if (node === marker) {
			node = leavelist.pop();
			if (visitor.leave) {
				ret = visitor.leave(node, leavelist[leavelist.length - 1]);
			} else {
				ret = undefined;
			}
			if (ret === VisitorOption.Break) {
				return;
			}
		} else if (node) {
			if (visitor.enter) {
				ret = visitor.enter(node, leavelist[leavelist.length - 1]);
			} else {
				ret = undefined;
			}

			if (ret === VisitorOption.Break) {
				return;
			}

			worklist.push(marker);
			leavelist.push(node);

			if (ret !== VisitorOption.Skip) {
				candidates = VisitorKeys[node.type];
				current = candidates.length;
				while ((current -= 1) >= 0) {
					candidate = node[candidates[current]];
					if (candidate) {
						if (isArray(candidate)) {
							current2 = candidate.length;
							while ((current2 -= 1) >= 0) {
								if (candidate[current2]) {
									worklist.push(candidate[current2]);
								}
							}
						} else {
							worklist.push(candidate);
						}
					}
				}
			}
		}
	}
}

Traverse.VisitorOption = VisitorOption;

module.exports = Traverse;