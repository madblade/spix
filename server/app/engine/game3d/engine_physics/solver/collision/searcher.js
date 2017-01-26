/**
 *
 */

'use strict';

/**
 * How to use:
 *
 * // Start with:
 * let s = new Searcher();
 * s.initObjects(objects);
 *
 * // Whenever sth. moves:
 * s.updateObjectAxis(object.index);
 *
 */

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ObjectsIterator = exports.Searcher = undefined;

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Searcher = exports.Searcher = function () {

    // Fast intern. math. util.
    // No getters/setters.

    function Searcher() {
        (0, _classCallCheck3.default)(this, Searcher);

        this.entities = [];
        this.objectsAxisX = [];
        this.objectsAxisY = [];
        this.objectsAxisZ = [];
    }

    (0, _createClass3.default)(Searcher, [{
        key: 'updateObjectAxis',
        value: function updateObjectAxis(i) {
            var axisX = this.objectsAxisX;
            var axisY = this.objectsAxisY;
            var axisZ = this.objectsAxisZ;

            var objects = this.entities;
            var object = objects[i];
            var length = objects.length;

            var x = object.position[0];
            var y = object.position[1];
            var z = object.position[2];

            var iXl = object.indexX - 1,
                iXr = object.indexX + 1;
            var iYl = object.indexY - 1,
                iYr = object.indexY + 1;
            var iZl = object.indexZ - 1,
                iZr = object.indexZ + 1;

            // Resort left X.
            while (iXl > -1 && objects[axisX[iXl]].position[0] > x) {
                this.swap(axisX, iXl, iXl + 1);
                --iXl;
            }
            // Resort right X.
            while (iXr < length && objects[axisX[iXr]].position[0] < x) {
                this.swap(axisX, iXr, iXr - 1);
                ++iXr;
            }

            // Resort left Y.
            while (iYl > -1 && objects[axisY[iYl]].position[1] > y) {
                this.swap(axisY, iYl, iYl + 1);
                --iYl;
            }
            // Resort right Y.
            while (iYr < length && objects[axisY[iYr]].position[1] < y) {
                this.swap(axisY, iYr, iYr - 1);
                ++iYr;
            }

            // Resort left Z.
            while (iZl > -1 && objects[axisZ[iZl]].position[2] > z) {
                swap(axisZ, iZl, iZl + 1);
                --iZl;
            }
            // Resort right Z.
            while (iZr < length && objects[axisZ[iZr]].position[2] < z) {
                swap(axisZ, iZr, iZr - 1);
                ++iZr;
            }
        }
    }, {
        key: 'swap',
        value: function swap(axisArray, i, j) {
            var objects = this.entities;
            Searcher.SWP(axisArray, i, j);

            if (axisArray === this.objectsAxisX) {
                objects[axisArray[i]].indexX = i;
                objects[axisArray[j]].indexX = j;
            } else if (axisArray === this.objectsAxisY) {
                objects[axisArray[i]].indexY = i;
                objects[axisArray[j]].indexY = j;
            } else if (axisArray === this.objectsAxisZ) {
                objects[axisArray[i]].indexZ = i;
                objects[axisArray[j]].indexZ = j;
            }
        }
    }, {
        key: 'initObjects',
        value: function initObjects(objects) {
            this.entities = objects;

            var axisX = this.objectsAxisX;
            var axisY = this.objectsAxisY;
            var axisZ = this.objectsAxisZ;

            // Init objects order on every axis.
            for (var i = 0; i < objects.length; ++i) {
                axisX[i] = i;
                axisY[i] = i;
                axisZ[i] = i;
            }

            axisX.sort(function (a, b) {
                if (objects[a].position[0] < objects[b].position[0]) return -1;else if (objects[a].position[0] > objects[b].position[0]) return 1;else return 0;
            });

            axisY.sort(function (a, b) {
                if (objects[a].position[1] < objects[b].position[1]) return -1;else if (objects[a].position[1] > objects[b].position[1]) return 1;else return 0;
            });

            axisZ.sort(function (a, b) {
                if (objects[a].position[2] < objects[b].position[2]) return -1;else if (objects[a].position[2] > objects[b].position[2]) return 1;else return 0;
            });

            // Init object indices on every axis.
            var numberOfObjects = objects.length;
            for (i = 0; i < numberOfObjects; ++i) {
                objects[axisX[i]].indexX = i;
                objects[axisY[i]].indexY = i;
                objects[axisZ[i]].indexZ = i;
            }
        }
    }], [{
        key: 'SWP',
        value: function SWP(array, i, j) {
            var t = array[i];
            array[i] = array[j];
            array[j] = t;
            return array;
        }
    }]);
    return Searcher;
}();

/**
 * How to use:
 *
 * let iterator = new ObjectsIterator(searcher, object.index, howFarToSearch);
 * while ((let you = iterator.next()) != null) {
 *     // Do stuff with next element (i.e. collide)
 * }
 *
 */


var ObjectsIterator = exports.ObjectsIterator = function () {
    function ObjectsIterator(searcher, objectIndex, threshold) {
        (0, _classCallCheck3.default)(this, ObjectsIterator);

        var objects = searcher.entities;

        this.axisX = searcher.objectsAxisX;
        this.axisY = searcher.objectsAxisY;
        this.axisZ = searcher.objectsAxisZ;

        this.objects = objects;

        this.object = objects[objectIndex];
        this.x = this.object.position[0];
        this.y = this.object.position[1];
        this.z = this.object.position[2];

        this.iX = this.object.indexX;
        this.iY = this.object.indexY;
        this.iZ = this.object.indexZ;

        this.onX = true;
        this.onY = false;
        this.onZ = false;

        this.threshold = threshold;
        this.nbObjects = objects.length;
        //this.objectIndex = objectIndex;

        this.step = 0;
        this.toRight = true;
    }

    (0, _createClass3.default)(ObjectsIterator, [{
        key: 'next',
        value: function next() {
            var objects = this.objects;

            var axisX = this.axisX;
            var axisY = this.axisY;
            var axisZ = this.axisZ;

            var x = this.x;var iX = this.iX;
            var y = this.y;var iY = this.iY;
            var z = this.z;var iZ = this.iZ;

            var max = this.nbObjects;
            var t = this.threshold;

            this.step += 1;

            var abs = Math.abs;

            // Search on X axis.
            if (this.onX && this.toRight) {
                if (iX + this.step < max && abs(objects[axisX[iX + this.step]].position[0] - x) <= t) {
                    return objects[axisX[iX + this.step]];
                } else {
                    this.toRight = false;
                    this.step = 0;
                    return this.next();
                }
            }
            if (this.onX && !this.toRight) {
                if (iX - this.step > -1 && abs(objects[axisX[iX - this.step]].position[0] - x) <= t) {
                    return objects[axisX[iX - this.step]];
                } else {
                    this.toRight = true;
                    this.onX = false;
                    this.onY = true;
                    this.step = 0;
                    return this.next();
                }
            }

            // Search on Y axis.
            if (this.onY && this.toRight) {
                if (iY + this.step < max && abs(objects[axisY[iY + this.step]].position[1] - y) <= t) {
                    return objects[axisY[iY + this.step]];
                } else {
                    this.toRight = false;
                    this.step = 0;
                    return this.next();
                }
            }
            if (this.onY && !this.toRight) {
                if (iY - this.step > -1 && abs(objects[axisY[iY - this.step]].position[1] - y) <= t) {
                    return objects[axisY[iY - this.step]];
                } else {
                    this.toRight = true;
                    this.onY = false;
                    this.step = 0;
                    /*this.onZ = true;
                     this.step = 0;
                     return this.next();*/
                    return null;
                }
            }

            // TODO [LOW] Search on Z axis.
            /*if (this.onZ && this.toRight) {
             }
             if (this.onZ && !this.toRight) {
             }*/
        }
    }]);
    return ObjectsIterator;
}();
//# sourceMappingURL=searcher.js.map
