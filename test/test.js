var YP = Y.Plugin;

var YPA = YP.AutoComplete;

'use strict';

var a, b, c, YDOM = Y.DOM.NonExistingModule;

var YScreen = YDOM.FakeModule;

a = YDOM;

a.XModule;

var listLinks;

var overlay = new Y.Overlay({
    srcNode: '#myContent',
    visible: false,
    width: '20em'
});

Y.throttle(function() {
    var a = Y.DOM;
});

listLinks.plug(
    Y.Plugin.Drop,
    {
        bubbleTargets: '1'
    }
);

var a = YDOM.TestModule;

var ac = new Y.AutoComplete({
    resultFilters : ['phraseMatch', 'phraseMatchCase'],
    resultHighlighter: 'phraseMatchCase',
    inputNode: '#ac-input',
    source : ['friends', 'Romans', 'countrymen']
});

var ac = new YPA({
    resultFilters : ['phraseMatch', 'phraseMatchCase'],
    resultHighlighter: 'phraseMatchCase',
    inputNode: '#ac-input',
    source : ['friends', 'Romans', 'countrymen']
});

Y.one('#ac-input').plug(Y.Plugin.AutoComplete, {
    resultFilters : ['phraseMatch', 'phraseMatchCase'],
    resultHighlighter: 'phraseMatchCase',
    source: ['foo', 'bar', 'baz']
});

Y.one('#ac-input').plug(YPA, {
    resultFilters : ['phraseMatch', 'phraseMatchCase'],
    resultHighlighter: 'phraseMatchCase',
    source: ['foo', 'bar', 'baz']
});