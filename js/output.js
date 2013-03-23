'use strict';

function OutputWriter(config) {
    this._config = config;

    this._indent = new Array(5).join(' ');
    this._indent2x = this._indent + this._indent;
}

OutputWriter.prototype = {
    constructor: OutputWriter,

    writeStart: function() {
        this._config.stream.write('{\n');
    },

    write: function(fileName, modules) {
        var stream = this._config.stream;

        if (this._passed) {
            stream.write(',');
        }

        stream.write(this._indent + '"' + fileName + '": {\n');

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

        stream.write(this._indent2x + '"modules": "' + Object.keys(moduleNames).join(', ') + '"\n' + this._indent + '}\n');

        this._passed = true;
    },

    writeEnd: function() {
        this._config.stream.write('}\n');
    }
};

module.exports = OutputWriter;