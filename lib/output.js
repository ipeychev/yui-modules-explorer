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

    function OutputWriter(config) {
        this._config = config;

        this._indent = new Array(5).join(' ');
        this._indent2x = this._indent + this._indent;
    }

    OutputWriter.prototype = {
        constructor: OutputWriter,

        writeStart: function() {
            this._config.stream.write('{');
        },

        write: function(modules, data) {
            var stream = this._config.stream;

            stream.write((this._passed ? ',\n' : '\n') + this._indent + '"' + data.name + '": {\n');

            var classes = {};
            var moduleNames = {};

            modules.forEach(
                function(module) {
                    if (this._config.classes) {
                        classes[module.className] = 1;
                    }

                    moduleNames[module.submodule ? module.submodule : module.module] = 1;
                },
                this
            );

            if (this._config.classes) {
                stream.write(this._indent2x + '"classes": "' + Object.keys(classes).join(', ') + '",\n');
            }

            moduleNames = Object.keys(moduleNames).join('", "');

            if (moduleNames) {
                moduleNames = '"' + moduleNames + '"';
            }

            stream.write(this._indent2x + '"requires": [' + moduleNames + ']' + '\n' + this._indent + '}');

            this._passed = true;
        },

        writeEnd: function() {
            this._config.stream.write('\n}');
        }
    };

    module.exports.OutputWriter = OutputWriter;
}());