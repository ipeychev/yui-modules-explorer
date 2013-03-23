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

        stream.write(this._indent2x + '"modules": "' + Object.keys(moduleNames).join(', ') + '"\n' + this._indent + '}');

        this._passed = true;
    },

    writeEnd: function() {
        this._config.stream.write('\n}');
    }
};

module.exports = OutputWriter;