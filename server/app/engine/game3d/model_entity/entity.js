/**
 *
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Entity = function () {
    function Entity(id) {
        (0, _classCallCheck3.default)(this, Entity);

        // Properties
        this._id = id;
        this._kind = 'abstract';

        // Inputs
        this._directions = null;

        // PhysicsEngine
        this._rotation = null;
        this._position = null;
        this._speed = null;
        this._acceleration = null;
        this._mass = 1;
        this._adherence = [false, false, false, // Right, Into, Up
        false, false, false]; // Left, From, Down

        this._impulseSpeedStamp = null;
        this._needsEuler = true;

        // Situation.
        this._worldId = -1;
    }

    (0, _createClass3.default)(Entity, [{
        key: 'jump',
        value: function jump(direction) {
            this._adherence[direction] = false;
        }
    }, {
        key: 'spawn',
        value: function spawn(position, worldId) {
            this._worldId = worldId;
            this._position = position;
            this._rotation = [0, Math.PI / 2];
            this._directions = [false, false, false, false, false, false];
            this._speed = [0, 0, 0];
            this._acceleration = [0, 0, 0];
            this._impulseSpeedStamp = [0, 0, 0];
        }
    }, {
        key: 'die',
        value: function die() {
            this._position = null;
            this._rotation = null;
            this._speed = null;
            this._directions = null;
        }
    }, {
        key: 'stop',
        value: function stop() {
            this._directions = [false, false, false, false, false, false];
            this._impulseSpeedStamp = [0, 0, 0];
            console.log("Entity stopping.");
        }
    }, {
        key: 'goForward',
        value: function goForward() {
            this._directions[0] = true;
        }
    }, {
        key: 'goRight',
        value: function goRight() {
            this._directions[1] = true;
        }
    }, {
        key: 'goLeft',
        value: function goLeft() {
            this._directions[2] = true;
        }
    }, {
        key: 'goBackwards',
        value: function goBackwards() {
            this._directions[3] = true;
        }
    }, {
        key: 'goUp',
        value: function goUp() {
            this._directions[4] = true;
        }
    }, {
        key: 'goDown',
        value: function goDown() {
            this._directions[5] = true;
        }
    }, {
        key: 'stopForward',
        value: function stopForward() {
            this._directions[0] = false;
        }
    }, {
        key: 'stopRight',
        value: function stopRight() {
            this._directions[1] = false;
        }
    }, {
        key: 'stopLeft',
        value: function stopLeft() {
            this._directions[2] = false;
        }
    }, {
        key: 'stopBackwards',
        value: function stopBackwards() {
            this._directions[3] = false;
        }
    }, {
        key: 'stopUp',
        value: function stopUp() {
            this._directions[4] = false;
        }
    }, {
        key: 'stopDown',
        value: function stopDown() {
            this._directions[5] = false;
        }
    }, {
        key: 'rotate',
        value: function rotate(p, y) {
            this._rotation[0] = p;
            this._rotation[1] = y;
        }
    }, {
        key: 'id',
        get: function get() {
            return this._id;
        }
    }, {
        key: 'kind',
        get: function get() {
            return this._kind;
        }
    }, {
        key: 'directions',
        get: function get() {
            return this._directions;
        }
    }, {
        key: 'rotation',
        get: function get() {
            return this._rotation;
        },
        set: function set(nr) {
            this._rotation = nr;
        }
    }, {
        key: 'position',
        get: function get() {
            return this._position;
        },
        set: function set(np) {
            this._position = np;
        }
    }, {
        key: 'speed',
        get: function get() {
            return this._speed;
        },
        set: function set(ns) {
            this._speed = ns;
        }
    }, {
        key: 'acceleration',
        get: function get() {
            return this._acceleration;
        },
        set: function set(na) {
            this._acceleration = na;
        }
    }, {
        key: 'mass',
        get: function get() {
            return this._mass;
        }
    }, {
        key: '_impulseSpeed',
        get: function get() {
            return this._impulseSpeedStamp;
        },
        set: function set(nis) {
            this._impulseSpeedStamp = nis;
        }
    }, {
        key: 'worldId',
        get: function get() {
            return this._worldId;
        },
        set: function set(nwi) {
            this._worldId = nwi;
        }
    }, {
        key: 'adherence',
        set: function set(na) {
            this._adherence = na;
        },
        get: function get() {
            return this._adherence;
        }
    }]);
    return Entity;
}();

exports.default = Entity;
//# sourceMappingURL=entity.js.map
