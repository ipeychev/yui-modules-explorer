/*
Copyright (C) 2013 Iliyan Peychev <iliyan.peychev@gmail.com>

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright
    notice, this list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright
    notice, this list of conditions and the following disclaimer in the
    documentation and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

(function() {
    'use strict';

    var esprima = require('esprima');
    var EventEmitter = require('events').EventEmitter;
    var Traverse = require('./traverse').Traverse;
    var util = require('util');

    function FileParser(config) {
        this._config = config;
    }

    util.inherits(FileParser, EventEmitter);

    FileParser.prototype.enter = function(node, parent) {
        var alias, identifiers, value;

        if (node.type === 'MemberExpression') {
            identifiers = this._processMemberExpression(node, parent);

            this._addIdentifiers(identifiers);

            return Traverse.VisitorOption.Skip;
        }
        else if (node.type === 'VariableDeclarator' && node.init && node.init.type === 'MemberExpression') {
            identifiers = this._processMemberExpression(node.init, node);

            value = this._addIdentifiers(identifiers);

            if (value) {
                alias = node.id.name;

                this._addAlias(alias, identifiers, value);
            }

            return Traverse.VisitorOption.Skip;
        }
        else if (node.type === 'ExpressionStatement' && node.expression) {
            this._processExpressionStatement(node);
        }
        else if (node.type === 'NewExpression') {
            this._processNewExpression(node);
        }
    };

    FileParser.prototype.parse = function(content, data) {
        this._beforeCodeParse();

        var ast = this._parseContent(content);

        if (!ast) {
            this.emit('failure', data);

            return [];
        }

        var traverse = new Traverse(ast, this);

        var modules = this._resolveModules();

        this.emit('success', modules, data);

        return modules;
    };

    FileParser.prototype._beforeCodeParse = function() {
        this._yuiClasses = Object.create(null);

        this._config.yuiVariables.forEach(
            function(item, index) {
                this._yuiClasses[item] = Object.create(null);
            },
            this
        );

        this._aliases = Object.create(null);

        this._classProperties = Object.create(null);
    };

    FileParser.prototype._addAlias = function(alias, identifiers, value) {
        if (!this._aliases[alias]) {
            this._aliases[alias] = {
                identifiers: identifiers,
                value: value
            };
        }

        if (!this._yuiClasses[alias]) {
            this._yuiClasses[alias] = value;
        }
    };

    FileParser.prototype._addIdentifiers = function(identifiers) {
        var i, identifierValue, item, mainIdentifier;

        if (!identifiers) {
            return;
        }

        mainIdentifier = identifiers[0];

        if (!this._yuiClasses[mainIdentifier]) {
            return;
        }

        identifierValue = this._yuiClasses[mainIdentifier];

        for (i = 1; i < identifiers.length; i++) {
            item = identifiers[i];

            if (!identifierValue[item]) {
                identifierValue[item] = {};
            }

            identifierValue = identifierValue[item];
        }

        return identifierValue;
    };

    FileParser.prototype._findClassProperties = function(identifier) {
        var mapClass;

        this._config.modulesByProperties.some(
            function(item, index) {
                if(!(item.variable < identifier || identifier < item.variable)) {
                    mapClass = item;

                    return true;
                }
            }
        );

        return mapClass;
    };

    FileParser.prototype._extractPropsAttrbiutes = function(attrs) {
        var result = {};

        this._extractPropsAttrbiutesImpl(attrs, result);

        return result;
    };

    FileParser.prototype._explodeAlias = function(alias) {
        var result = [];

        function clone(old) {
            var hop = Object.prototype.hasOwnProperty;

            var obj = Object.create(null);

            for (var i in old) {
                if (hop.call(old, i)) {
                    obj[i] = old[i];
                }
            }

            return obj;
        }

        this._explodeAliasImpl(alias, clone(this._aliases), result);

        return result;
    };

    FileParser.prototype._getModules = function(data, classes, modulesFromClassProperties) {
        var modules = this._getModulesImpl(data, classes);

        modules = this._mergeYAliases(data, modules);

        modules = modules.concat(modulesFromClassProperties);

        return modules;
    };

    FileParser.prototype._mergeYAliases = function(data, modules) {
        var alias, hop = Object.prototype.hasOwnProperty, key, yuiAliases;

        yuiAliases = this._config.yuiAliases;

        for (key in data) {
            if (hop.call(data, key)) {
                alias = yuiAliases[key];

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
        }

        return modules;
    };

    FileParser.prototype._parseContent = function(content) {
        var ast;

        try {
            ast = esprima.parse(content);
        }
        catch(e) {
            console.error('Failed to parse the following content:\n' + content);
        }

        return ast;
    };

    FileParser.prototype._processArrayExpression = function(node, parent) {
        var elements, result = [];

        if (node.type === 'ArrayExpression') {
            elements = node.elements;

            elements.forEach(
                function(item, index) {
                    if (item.type === 'Literal') {
                        result.push(item.value);
                    }
                },
                this
            );
        }

        return result;
    };

    FileParser.prototype._processAssignmentExpression = function(node, parent) {
        var leftExpression, rightIdentifier, rightStatement;

        rightStatement = node.right;

        if (rightStatement.type === 'Identifier') {
            rightIdentifier = rightStatement.name;

            if (rightIdentifier) {
                leftExpression = node.left;

                if (leftExpression.type === 'Identifier') {
                    this._yuiClasses[leftExpression.name] = this._yuiClasses[rightIdentifier];
                }
            }
        }
    };

    FileParser.prototype._processCallExpression = function(node, parent) {
        var identifiers;

        if (node.type === 'CallExpression' && node.callee.type === 'MemberExpression') {
            identifiers = this._processMemberExpression(node.callee, node);
        }
        else if(node.type === 'CallExpression' && node.callee.type === 'CallExpression') {
            identifiers = this._processCallExpressionArguments(node.callee, node);
        }
        else if(node.type === 'CallExpression' && node.callee.type === 'Identifier') {
            identifiers = [node.callee.name];
        }

        return identifiers;
    };

    FileParser.prototype._processCallExpressionArguments = function(node, parent) {
        var args = node['arguments'], attrs, explodedIdentifier, identifier;

        if (args.length >= 2) {
            if (args[0].type === 'MemberExpression' && args[1].type === 'ObjectExpression') {
                identifier = this._processMemberExpression(args[0], node);
            }
            else if (args[0].type === 'Identifier' && args[1].type === 'ObjectExpression') {
                identifier = args[0].name;
            }

            if (identifier) {
                this._resoveClassesByProperties(identifier, args[1], node);
            }
        }
    };

    FileParser.prototype._processExpressionStatement = function(node) {
        var expression, identifiers;

        expression = node.expression;

        if (expression.type === 'CallExpression') {
            identifiers = this._processCallExpressionArguments(expression, node);

            this._addIdentifiers(identifiers);

            this._processCallExpressionArguments(expression, node);
        }
        else if (expression.type === 'AssignmentExpression' && expression.operator === '=') {
            this._processAssignmentExpression(expression, node);
        }
    };

    FileParser.prototype._processMemberExpression = function(node, parent) {
        var identifiers = [];

        this._processMemberExpressionImpl(node, parent, identifiers);

        return identifiers;
    };

    FileParser.prototype._processNewExpression = function(node, parent) {
        var args = node['arguments'], callee = node.callee, identifier;

        if (callee.type === 'Identifier' && args.length && args[0].type === 'ObjectExpression') {
            identifier = callee.name;
        }
        else if (callee.type === 'MemberExpression' && args.length && args[0].type === 'ObjectExpression') {
            identifier = this._processMemberExpression(callee, node);
        }

        if (identifier) {
            this._resoveClassesByProperties(identifier, args[0], node);
        }
    };

    FileParser.prototype._processObjectExpression = function(node, parent) {
        var properties = node.properties, result = [];

        properties.forEach(
            function(item, index) {
                var property = this._processProperty(item, node);

                result.push(property);
            },
            this
        );

        return result;
    };

    FileParser.prototype._processProperty = function(node, parent) {
        var nodeKey, nodeValue, properties, result = Object.create(null);

        if (node.type === 'Property') {
            nodeKey = node.key;
            nodeValue = node.value;

            if (nodeValue.type === 'Literal' && nodeKey.type === 'Identifier') {
                result[nodeKey.name] = nodeValue.value;
            }
            else if (nodeValue.type === 'ArrayExpression') {
                properties = this._processArrayExpression(nodeValue, node);

                result[nodeKey.name] = properties;
            }
        }

        return result;
    };

    FileParser.prototype._resoveClassesByProperties = function(identifier, node, parent) {
        var attrs, explodedIdentifier = this._explodeAlias(identifier), mapClass;

        mapClass = this._findClassProperties(explodedIdentifier);

        if (mapClass) {
            attrs = this._processObjectExpression(node, parent);

            this._classProperties[mapClass['class']] = this._extractPropsAttrbiutes(attrs);
        }
    };

    FileParser.prototype._resolveModulesByClassProperties = function(item, propertiesContainer, modules) {
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
    };

    FileParser.prototype._explodeAliasImpl = function(alias, aliases, result) {
        var data = aliases[alias];

        if (!data) {
            result.push(alias);

            return;
        }

        aliases[alias] = null;

        data.identifiers.forEach(
            function(item, index) {
                this._explodeAliasImpl(item, aliases, result);
            },
            this
        );
    };

    FileParser.prototype._extractPropsAttrbiutesImpl = function(attrs, result) {
        attrs.forEach(
            function(item, index) {
                var hop = Object.prototype.hasOwnProperty, key, value;

                if (typeof item == 'string') {
                    result[item] = 1;
                }
                else {
                    for (key in item) {
                        if (hop.call(item, key)) {
                            value = item[key];

                            if (Array.isArray(value)) {
                                this._extractPropsAttrbiutesImpl(value, result);
                            }
                            else {
                                result[key] = 1;
                            }
                        }
                    }
                }
            },
            this
        );
    };

    FileParser.prototype._getModulesImpl = function(data, classes, parent) {
        var className, hop = Object.prototype.hasOwnProperty, key, modules = [];

        for (key in data) {
            if (hop.call(data, key)) {
                className = (parent ? parent + '.' : '') + key;

                if (classes[className]) {
                    modules.push(
                        {
                            className: className,
                            module: classes[className].module,
                            submodule: classes[className].submodule
                        }
                    );
                }

                modules = modules.concat(this._getModulesImpl(data[key], classes, className));
            }
        }

        return modules;
    };

    FileParser.prototype._processMemberExpressionImpl = function(node, parent, identifiers) {
        if (node.type === 'MemberExpression') {
            this._processMemberExpressionImpl(node.object, node, identifiers);

            this._processMemberExpressionImpl(node.property, node, identifiers);
        }
        else if (node.type === 'Identifier') {
            identifiers.push(node.name);
        }
    };

    FileParser.prototype._resolveModules = function() {
        var data = this._config.data;

        var dataClasses = data.classes;

        var dataClassItems = data.classitems;

        var modulesFromClassProperties = Object.create(null);

        dataClassItems.forEach(
            function(item, index) {
                this._resolveModulesByClassProperties(item, this._classProperties, modulesFromClassProperties);
            },
            this
        );

        return this._getModules(this._yuiClasses.Y, dataClasses, this._values(modulesFromClassProperties));
    };

    FileParser.prototype._values = function(obj) {
        var hop = Object.prototype.hasOwnProperty, key, values = [];

        for (key in obj) {
            if (hop.call(obj, key)) {
                values.push(obj[key]);
            }
        }

        return values;
    };

    module.exports.FileParser = FileParser;
}());