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

Y.one('#ac-input').plug(Y.Plugin.AutoComplete, {
	source: ['foo', 'bar', 'baz']
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