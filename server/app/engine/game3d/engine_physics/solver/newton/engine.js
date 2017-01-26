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

var _integrator = require('./integrator');

var _integrator2 = _interopRequireDefault(_integrator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Newton = function () {
    function Newton() {
        (0, _classCallCheck3.default)(this, Newton);
    }

    (0, _createClass3.default)(Newton, null, [{
        key: 'solve',

        //static gravity = [0, 0, 0];

        value: function solve(physicsEngine, Δt) {

            var EM = physicsEngine.entityModel;
            var WM = physicsEngine.worldModel; // TODO [HIGH] worldify, sort/optimize in entityModel.
            var o = physicsEngine.outputBuffer;

            var dt = Δt / Newton.globalTimeDilatation;
            if (dt > 5.0) {
                dt = 5.0;
            }

            EM.forEach(function (entity) {
                var worldId = entity.worldId;
                var world = WM.getWorld(worldId);
                var entityUpdated = Newton.linearSolve(entity, EM, world, dt);

                if (entityUpdated) {
                    o.entityUpdated(entity.id);
                }
            });

            // Get entities inputs
            // Compute forces on global fields
            // Compute forces on local fields

            // Solve movements
            // Compute entity collisions
            // Compute terrain collisions
            // Solve again

            // Update positions

            // Effects
            // Reverse time...

            // Future...
            // Update orientations
            // Manage fragmentation
        }
        //static globalTimeDilatation = 3000000;

    }, {
        key: 'linearSolve',
        value: function linearSolve(entity, EM, world, dt) {
            var theta = entity.rotation[0];
            var ds = entity.directions;
            var pos = entity.position;

            var impulseSpeed = [0, 0, 0];
            var force = [0, 0, 0];
            var hasUpdated = false;

            Newton.computeDesiredSpeed(entity, impulseSpeed, theta, ds, dt);

            Newton.sumGlobalFields(force, pos, entity);

            // Newton.sumLocalFields(force, pos, EM);

            hasUpdated = _integrator2.default.updatePosition(dt, impulseSpeed, force, entity, EM, world);

            return hasUpdated;
        }
    }, {
        key: 'quadraticSolve',
        value: function quadraticSolve(entity, EM, world, dt) {
            var theta = entity.rotation[0];
            var ds = entity.directions;
            var pos = entity.position;

            var impulseSpeed = [0, 0, 0];
            var force = [0, 0, 0];
            var hasUpdated = false;

            Newton.computeDesiredSpeed(entity, impulseSpeed, theta, ds, dt);

            Newton.sumGlobalFields(force, pos, entity);

            Newton.sumLocalFields(force, pos, EM);

            // TODO [HIGH] manage collisions

            hasUpdated = _integrator2.default.updatePosition(dt, impulseSpeed, force, entity, EM, world);

            return hasUpdated;
        }
    }, {
        key: 'add',
        value: function add(result, toAdd) {
            result[0] += toAdd[0];
            result[1] += toAdd[1];
            result[2] += toAdd[2];
        }
    }, {
        key: 'computeDesiredSpeed',
        value: function computeDesiredSpeed(entity, speed, theta, ds, dt) {
            var desiredSpeed = [0, 0, 0];
            var pi4 = Math.PI / 4;

            if (ds[0] && !ds[3]) // forward quarter
                {
                    var theta2 = theta;
                    if (ds[1] && !ds[2]) // right
                        theta2 -= pi4;else if (ds[2] && !ds[1]) // left
                        theta2 += pi4;
                    desiredSpeed[0] = -Math.sin(theta2);
                    desiredSpeed[1] = Math.cos(theta2);
                } else if (ds[3] && !ds[0]) // backward quarter
                {
                    var _theta = theta;
                    if (ds[1] && !ds[2]) // right
                        _theta += pi4;else if (ds[2] && !ds[1]) // left
                        _theta -= pi4;
                    desiredSpeed[0] = Math.sin(_theta);
                    desiredSpeed[1] = -Math.cos(_theta);
                } else if (ds[1] && !ds[2]) // exact right
                {
                    desiredSpeed[0] = Math.cos(theta);
                    desiredSpeed[1] = Math.sin(theta);
                } else if (ds[2] && !ds[1]) // exact left
                {
                    desiredSpeed[0] = -Math.cos(theta);
                    desiredSpeed[1] = -Math.sin(theta);
                }

            var godMode = false;
            if (godMode) {
                desiredSpeed[2] = ds[4] && !ds[5] ? 1 : ds[5] && !ds[4] ? -1 : 0;
            } else {
                if (ds[4] && !ds[5]) {
                    for (var i = 0; i < 3; ++i) {
                        if (Newton.gravity[i] < 0 && entity.adherence[i]) {
                            entity.acceleration[i] = 3.3 / dt;
                            entity.jump(i); // In which direction I jump
                        }
                    }
                    for (var _i = 3; _i < 6; ++_i) {
                        if (Newton.gravity[_i - 3] > 0 && entity.adherence[_i]) {
                            entity.acceleration[_i - 3] = -3.3 / dt;
                            entity.jump(_i); // In which direction I jump
                        }
                    }
                }
            }

            desiredSpeed[0] *= 0.65;
            desiredSpeed[1] *= 0.65;
            desiredSpeed[2] *= 0.65;

            Newton.add(speed, desiredSpeed);
        }
    }, {
        key: 'sumGlobalFields',
        value: function sumGlobalFields(force, pos, entity) {
            // Gravity
            var grav = Newton.gravity;
            var m = entity.mass;
            var sum = [grav[0] * m, grav[1] * m, grav[2] * m];

            // sum[2] = 0; // ignore grav

            Newton.add(force, sum);
        }
    }, {
        key: 'sumLocalFields',
        value: function sumLocalFields(force, pos, EM) {
            var sum = [0, 0, 0];
            Newton.add(force, sum);
        }
    }]);
    return Newton;
}();

Newton.globalTimeDilatation = 20000000;
Newton.gravity = [0, 0, -0.11];
exports.default = Newton;
//# sourceMappingURL=engine.js.map
