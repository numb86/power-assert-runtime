'use strict';

var BaseRenderer = require('power-assert-renderer-base');
var inherits = require('util').inherits;
var forEach = require('array-foreach');
var stringifier = require('stringifier');
var stringWidth = require('./lib/string-width');
var extend = require('xtend');
var defaultOptions = require('./lib/default-options');

/**
 * options.stringify [function]
 * options.maxDepth [number]
 * options.indent [string]
 * options.lineSeparator [string]
 * options.anonymous [string]
 * options.circular [string]
 * options.snip [string]
 * options.handlers [object]
 * 
 * options.widthOf [function]
 * options.ambiguousEastAsianCharWidth [number]
 */
function DiagramRenderer (config) {
    BaseRenderer.call(this);
    this.config = extend(defaultOptions(), config);
    this.events = [];
    if (typeof this.config.stringify !== 'function') {
        this.stringify = stringifier(this.config);
    }
    if (typeof this.config.widthOf !== 'function') {
        this.widthOf = stringWidth(this.config);
    }
    this.initialVertivalBarLength = 1;
}
inherits(DiagramRenderer, BaseRenderer);

DiagramRenderer.prototype.onStart = function (context) {
    this.assertionLine = context.source.content;
    this.initializeRows();
};

DiagramRenderer.prototype.onData = function (esNode) {
    if (!esNode.isCaptured()) {
        return;
    }
    this.events.push({value: esNode.value(), range: esNode.range()});
};

DiagramRenderer.prototype.onEnd = function () {
    this.events.sort(rightToLeft);
    this.constructRows(this.events);
    var _this = this;
    forEach(this.rows, function (columns) {
        _this.write(columns.join(''));
    });
};

DiagramRenderer.prototype.initializeRows = function () {
    this.rows = [];
    for (var i = 0; i <= this.initialVertivalBarLength; i += 1) {
        this.addOneMoreRow();
    }
};

DiagramRenderer.prototype.newRowFor = function (assertionLine) {
    return createRow(this.widthOf(assertionLine), ' ');
};

DiagramRenderer.prototype.addOneMoreRow = function () {
    this.rows.push(this.newRowFor(this.assertionLine));
};

DiagramRenderer.prototype.lastRow = function () {
    return this.rows[this.rows.length - 1];
};

DiagramRenderer.prototype.renderVerticalBarAt = function (columnIndex) {
    var i, lastRowIndex = this.rows.length - 1;
    for (i = 0; i < lastRowIndex; i += 1) {
        this.rows[i].splice(columnIndex, 1, '|');
    }
};

DiagramRenderer.prototype.renderValueAt = function (columnIndex, dumpedValue) {
    var i, width = this.widthOf(dumpedValue);
    for (i = 0; i < width; i += 1) {
        this.lastRow().splice(columnIndex + i, 1, dumpedValue.charAt(i));
    }
};

DiagramRenderer.prototype.isOverlapped = function (prevCapturing, nextCaputuring, dumpedValue) {
    return (typeof prevCapturing !== 'undefined') && this.startColumnFor(prevCapturing) <= (this.startColumnFor(nextCaputuring) + this.widthOf(dumpedValue));
};

DiagramRenderer.prototype.constructRows = function (capturedEvents) {
    var that = this;
    var prevCaptured;
    forEach(capturedEvents, function (captured) {
        var dumpedValue = that.stringify(captured.value);
        if (that.isOverlapped(prevCaptured, captured, dumpedValue)) {
            that.addOneMoreRow();
        }
        that.renderVerticalBarAt(that.startColumnFor(captured));
        that.renderValueAt(that.startColumnFor(captured), dumpedValue);
        prevCaptured = captured;
    });
};

DiagramRenderer.prototype.startColumnFor = function (captured) {
    return this.widthOf(this.assertionLine.slice(0, captured.range[0]));
};

function createRow (numCols, initial) {
    var row = [], i;
    for(i = 0; i < numCols; i += 1) {
        row[i] = initial;
    }
    return row;
}

function rightToLeft (a, b) {
    return b.range[0] - a.range[0];
}

module.exports = DiagramRenderer;
