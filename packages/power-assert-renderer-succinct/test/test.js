'use strict';

delete require.cache[require.resolve('..')];
var SuccinctRenderer = require('..');
var AssertionRenderer = require('power-assert-renderer-assertion');

var helper = require('../../../test_helper/helper');
var assert = helper.assert;
var transpile = helper.transpile;
var testRendering = helper.testRendering;

describe('SuccinctRenderer', function () {
    it('assert(foo === bar)', function () {
        var foo = 'foo';
        var bar = 'bar';
        testRendering(function () {
            eval(transpile('assert(foo === bar)'));
        }, [
            '',
            'assert(foo === bar)',
            '       |       |   ',
            '       "foo"   "bar"',
        ], [AssertionRenderer, SuccinctRenderer]);
    });
});
