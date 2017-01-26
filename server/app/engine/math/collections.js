/**
 *
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _map = require('babel-runtime/core-js/map');

var _map2 = _interopRequireDefault(_map);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var CollectionUtils = function () {
    function CollectionUtils() {
        (0, _classCallCheck3.default)(this, CollectionUtils);
    }

    (0, _createClass3.default)(CollectionUtils, null, [{
        key: '_locationOf',


        // O(log(n))
        value: function _locationOf(element, array, start, end) {
            start = start || 0;
            end = end || array.length;
            var pivot = parseInt(start + (end - start) / 2, 10);
            if (end - start <= 1 || array[pivot] === element) return pivot;
            if (array[pivot] < element) {
                return CollectionUtils._locationOf(element, array, pivot, end);
            } else {
                return CollectionUtils._locationOf(element, array, start, pivot);
            }
        }
    }, {
        key: 'insert',
        value: function insert(element, array) {
            if (array === undefined) {
                var e = new Error('BLD @insert: undefined array.');
                console.log(e.stack);
                return -1;
            }
            var location = CollectionUtils._locationOf(element, array) + 1;
            if (array[location] === element) {
                console.log("Util.insert: element already in sorted array.");
                return location;
            }
            array.splice(location, 0, element);
            return location;
        }
    }, {
        key: 'insertWithLocation',
        value: function insertWithLocation(location, element, array) {
            if (array === undefined) {
                var e = new Error('BLD: undefined array.');
                console.log(e.stack);
                return -1;
            }
            if (array[location] === element) {
                console.log("Util.insert: element already in sorted array.");
                return location;
            }
            array.splice(location, 0, element);
            return location;
        }
    }, {
        key: 'generateId',
        value: function generateId(collection) {
            var random = function random(_) {
                return Math.floor(Math.random() * 1000000);
            };
            var id = random();

            if (collection instanceof _map2.default) {
                while (collection.has(id)) {
                    id = random();
                }
            } else if (collection instanceof Array) {
                // Array
                // Unicity mandatory check
                var f = function f(e) {
                    return e.id === id;
                };
                while (collection.filter(f).length > 0) {
                    id = random();
                }
            } else if (collection instanceof Object) {
                // Object <-> Map
                // Unicity mandatory check
                while (id in collection) {
                    id = random();
                }
            }

            return id;
        }
    }, {
        key: 'numberOfProperties',
        value: function numberOfProperties(object) {
            return (0, _keys2.default)(object).length;
        }
    }, {
        key: 'removeFromArray',
        value: function removeFromArray(array, object) {
            if (array === undefined) {
                var e = new Error('BLD @removeFromArray: undefined array.');
                console.log(e.stack);
                return -1;
            }
            var objectId = array.indexOf(object);
            if (objectId > -1) array.splice(objectId, 1);
            return objectId;
        }
    }, {
        key: 'removeFromArrayWithId',
        value: function removeFromArrayWithId(array, objectId) {
            if (objectId > -1) array.splice(objectId, 1);
        }
    }, {
        key: 'forEachProperty',
        value: function forEachProperty(object, func) {
            (0, _keys2.default)(object).forEach(func);
        }
    }]);
    return CollectionUtils;
}();

exports.default = CollectionUtils;
//# sourceMappingURL=collections.js.map
