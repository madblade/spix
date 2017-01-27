/**
 *
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _game = require('../../model/game/game');

var _game2 = _interopRequireDefault(_game);

var _input = require('./io_user/input/input');

var _input2 = _interopRequireDefault(_input);

var _output = require('./io_user/output/output');

var _output2 = _interopRequireDefault(_output);

var _input3 = require('./io_ai/input/input');

var _input4 = _interopRequireDefault(_input3);

var _output3 = require('./io_ai/output/output');

var _output4 = _interopRequireDefault(_output3);

var _ai = require('./io_ai/ai');

var _ai2 = _interopRequireDefault(_ai);

var _physics = require('./engine_physics/physics');

var _physics2 = _interopRequireDefault(_physics);

var _topology = require('./engine_topology/topology');

var _topology2 = _interopRequireDefault(_topology);

var _consistency = require('./engine_consistency/consistency');

var _consistency2 = _interopRequireDefault(_consistency);

var _model = require('./model_entity/model');

var _model2 = _interopRequireDefault(_model);

var _model3 = require('./model_world/model');

var _model4 = _interopRequireDefault(_model3);

var _model5 = require('./model_x/model');

var _model6 = _interopRequireDefault(_model5);

var _model7 = require('./model_consistency/model');

var _model8 = _interopRequireDefault(_model7);

var _chat = require('./../../model/connection/chat');

var _chat2 = _interopRequireDefault(_chat);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Game3D = function (_Game) {
    (0, _inherits3.default)(Game3D, _Game);

    function Game3D(hub, gameId, connector) {
        (0, _classCallCheck3.default)(this, Game3D);


        // Utility parameters

        var _this = (0, _possibleConstructorReturn3.default)(this, (0, _getPrototypeOf2.default)(Game3D).call(this, hub, gameId, connector));

        _this._kind = 'game3d';
        _this._refreshRate = 16;
        _this._tt = 0;

        // Misc.
        _this._chat = new _chat2.default(_this);

        // Models (autonomous).
        _this._worldModel = new _model4.default(_this);
        _this._entityModel = new _model2.default(_this);
        _this._xModel = new _model6.default(_this); // Needs world model.
        _this._consistencyModel = new _model8.default(_this);

        // Engines (need models).
        _this._ai = new _ai2.default(_this);
        _this._physicsEngine = new _physics2.default(_this);
        _this._topologyEngine = new _topology2.default(_this);
        _this._consistencyEngine = new _consistency2.default(_this);

        // I/O (need engines).
        _this._internalInput = new _input4.default(_this); // A.I.
        _this._internalOutput = new _output4.default(_this); // A.I.
        _this._externalInput = new _input2.default(_this); // Human.
        _this._externalOutput = new _output2.default(_this); // Human.

        // Generate then listen players.
        _this.generate();
        return _this;
    }

    // Model

    (0, _createClass3.default)(Game3D, [{
        key: 'update',


        //^
        value: function update() {
            // Idea maybe split in several loops (purposes).
            var t = void 0;
            var dt1 = void 0,
                dt2 = void 0,
                dt3 = void 0,
                dt4 = void 0,
                dt5 = void 0;

            /** Inputs **/
            t = process.hrtime();
            this._ai.update(); // Update intents.
            dt1 = process.hrtime(t)[1] / 1000;
            if (Game3D.bench && dt1 > 1000) console.log(dt1 + ' µs to update intents.');

            t = process.hrtime();
            this._externalInput.update(); // Update human spawn/leave requests.
            this._internalInput.update(); // Update artificial inputs.
            dt2 = process.hrtime(t)[1] / 1000;
            if (Game3D.bench && dt2 > 1000) console.log(dt2 + ' µs to update inputs.');

            /** Updates **/
            t = process.hrtime();
            this._topologyEngine.update(); // Update topological model.
            this._physicsEngine.update(); // Update physical simulation.
            dt3 = process.hrtime(t)[1] / 1000;
            if (Game3D.bench && dt3 > 1000) console.log(dt3 + ' µs to update engines.');

            /** Consistency solving: mediator between player and server models **/
            t = process.hrtime();
            this._consistencyEngine.update(); // Make client models consistent. Needs other engines.
            dt4 = process.hrtime(t)[1] / 1000;
            if (Game3D.bench && dt4 > 10000) console.log(dt4 + ' µs to update consistency.');

            /** Outputs **/
            t = process.hrtime();
            this._externalOutput.update(); // Send updates.
            this._internalOutput.update(); // Update perceptions.
            dt5 = process.hrtime(t)[1] / 1000;
            if (Game3D.bench && dt5 > 1000) console.log(dt5 + ' µs to update outputs.');

            // var n = this._playerManager.nbPlayers;
            // console.log("There " + (n>1?"are ":"is ") + n + " player" + (n>1?"s":"") + " connected.");
            // this._tt += 1;
            // if (this._tt % 1000 === 0) console.log((process.hrtime(time)[1]/1000) + " µs a loop.");
        }
    }, {
        key: 'generate',
        value: function generate() {
            var _this2 = this;

            this._consistencyEngine.generateWorld().then(function (_) {
                _this2._playerManager.setAddPlayerBehaviour(function (p) {
                    _this2._externalInput.addPlayer(p);
                });

                _this2._playerManager.setRemovePlayerBehaviour(function (player) {
                    _this2._externalInput.removePlayer(player.avatar.id);
                });

                _this2._ready = true;
            }).catch(function (e) {
                return console.log(e);
            });
        }
    }, {
        key: 'save',
        value: function save() {
            // TODO [LONG-TERM] write world into file.
        }
    }, {
        key: 'entityModel',
        get: function get() {
            return this._entityModel;
        }
    }, {
        key: 'worldModel',
        get: function get() {
            return this._worldModel;
        }
    }, {
        key: 'xModel',
        get: function get() {
            return this._xModel;
        }
    }, {
        key: 'consistencyModel',
        get: function get() {
            return this._consistencyModel;
        }
    }, {
        key: 'physicsEngine',
        get: function get() {
            return this._physicsEngine;
        }
    }, {
        key: 'topologyEngine',
        get: function get() {
            return this._topologyEngine;
        }
    }, {
        key: 'consistencyEngine',
        get: function get() {
            return this._consistencyEngine;
        }
    }, {
        key: 'chat',
        get: function get() {
            return this._chat;
        }
    }]);
    return Game3D;
}(_game2.default);

Game3D.bench = false;
exports.default = Game3D;
//# sourceMappingURL=game.js.map
