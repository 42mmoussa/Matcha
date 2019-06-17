'use strict';
var fs = require('fs');
var length$ = typeof Symbol === 'function' ? Symbol('length') : '@@length';

require.extensions['.sql'] = function(module, filename) {
    var content = fs.readFileSync(filename, 'utf8');
    module.exports = parseSQL(content.split('\n'));
}

module.exports = {
    parse : function parse(content) {
        if(typeof content !== 'string') {
            throw new TypeError('First argument must be string');
        }
        return parseSQL(content.split('\n'));
    },
    _findQuotes : findQuotes,
    _checkInQuote : checkInQuote
};

function parseSQL(lines) {
    var result = initResult();
    var delimiter = ';';
    var query;
    var name;
    function resetQuery() {
        query = '';
        name = null;
    }
    resetQuery();
    var inComment = false;

    for(var i = 0, n = lines.length; i < n; i++) {
        var p;
        var line = lines[i];
        var tLine = trim(line);
        if(tLine === '') continue;
        if(inComment) {
            if(!~(p = tLine.indexOf('*/'))) continue;
            tLine = tLine.substr(p + 2);
            inComment = false;
        }
        if(startsWith(tLine, '#') || startsWith(tLine, '-- ') || tLine === '--') {
            if(~(p = tLine.indexOf(':name='))) {
                name = tLine.substr(p + 6)
            }
            continue;
        }
        var quotes = findQuotes(line);
        p = 0;
        while(~(p = line.indexOf('/*', p))) {
            if(checkInQuote(quotes, p)) {
                p += 2;
                continue;
            }
            var p2 = line.indexOf('*/', p);
            if(~p2) {
                line = line.substr(0, p) + line.substr(p2);
                continue;
            }
            inComment = true;
            break;
        }
        if(inComment) continue;
        if(startsWith(tLine.toUpperCase(), 'DELIMITER ')) {
            delimiter = tLine.substr(10);
            continue;
        }
        p = 0;
        while(~(p = line.indexOf(delimiter, p))) {
            if(checkInQuote(quotes, p)) {
                p += delimiter.length;
                continue;
            }
            query += line.substr(0, p);
            line = line.substr(p + delimiter.length);
            quotes = findQuotes(line);
            p = 0;
            if(name && parseInt(name) != name) {
                result[name] = query;
            }
            result[result[length$]] = query;
            result[length$]++;
            resetQuery();
        }
        if(trim(line) === '') continue;
        if(line[line.length - 1] === '\r') {
            line = line.substr(0, line.length - 1)
        }
        query += line + '\n';
    }

    return result;
}

function initResult() {
    var result = {};
    Object.defineProperty(result, length$, {
        enumerable : false,
        writable : true,
        configurable : false,
        value : 0
    });
    Object.defineProperty(result, 'length', {
        enumerable : false,
        get : function() {
            return this[length$];
        }
    });
    if(Symbol && Symbol.iterator) {
        result[Symbol.iterator] = iterator
    }
    return result;
}

function iterator() {
    var $this = this;
    var i = 0;
    var len = this.length;
    return {
        next : function next() {
            var ret = {
                done : false,
                value : $this[i]
            };
            i++;
            if(i >= len) {
                ret.done = true;
            }
            return ret;
        }
    };
}

function trim(str) {
    if(typeof str.trim === 'function') {
        return str.trim();
    }
    return str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
}

function startsWith(str, startStr) {
    if(typeof str.startsWith === 'function') {
        return str.startsWith(startStr);
    }
    return str.substr(0, startStr.length) === startStr;
}

function findQuotes(str) {
    var result = [];
    var opened = null;
    var p;
    var n = str.length;
    for(var i = 0; i < n; i++) {
        if(str[i] === '"' || str[i] === '\'') {
            if(opened === str[i]) {
                if(str[i - 1] === '\\') continue;
                if(str[i + 1] === opened) {
                    i++;
                    continue;
                }
                result.push([p, i]);
                opened = null;
            } else if(opened === null) {
                opened = str[i];
                p = i;
            }
        }
    }
    return result;
}

function checkInQuote(qList, p) {
    var n = qList.length;
    for(var i = 0; i < n; i++) {
        if(qList[i][0] < p && qList[i][1] > p) return true;
    }
    return false;
}
