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

var _terrain = require('../collision/terrain');

var _terrain2 = _interopRequireDefault(_terrain);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Integrator = function () {
    function Integrator() {
        (0, _classCallCheck3.default)(this, Integrator);
    }

    (0, _createClass3.default)(Integrator, null, [{
        key: 'isNull',
        value: function isNull(vector3) {
            return vector3 === null || vector3[0] === 0 && vector3[1] === 0 && vector3[2] === 0;
        }
    }, {
        key: 'areEqual',
        value: function areEqual(vector3a, vector3b) {
            return vector3a[0] === vector3b[0] && vector3a[1] === vector3b[1] && vector3a[2] === vector3b[2];
        }
    }, {
        key: 'updatePosition',
        value: function updatePosition(dt, impulseSpeed, force, entity, EM, world) {

            //console.log(entity.adherence);
            //console.log(entity.acceleration);
            var hasUpdated = void 0;

            if (Integrator.isNull(entity.acceleration)) {
                //console.log('Euler');
                hasUpdated = Integrator.integrateEuler(dt, impulseSpeed, force, entity, EM, world);
            } else {
                //console.log('Leapfrog');
                hasUpdated = Integrator.integrateLeapfrog(dt, impulseSpeed, force, entity, EM, world);
            }

            return hasUpdated;
        }

        // First-order integrator
        // @returns {boolean} whether entity has updated

    }, {
        key: 'integrateEuler',
        value: function integrateEuler(dt, impulseSpeed, force, entity, EM, world) {
            var mass = entity.mass;

            var position = entity.position;
            var speed = entity.speed;

            // Update acceleration
            var newAcceleration = [0, 0, 0];
            if (mass > 0) {
                for (var i = 0; i < 3; ++i) {
                    newAcceleration[i] = force[i] / mass;
                }
            }

            // Update speed
            var newSpeed = [speed[0], speed[1], speed[2]];
            var previousImpulseSpeed = entity._impulseSpeed;
            if (!Integrator.areEqual(previousImpulseSpeed, impulseSpeed)) {
                for (var _i = 0; _i < 3; ++_i) {
                    newSpeed[_i] = newSpeed[_i] + impulseSpeed[_i] - previousImpulseSpeed[_i];
                }
            }
            for (var _i2 = 0; _i2 < 3; ++_i2) {
                newSpeed[_i2] += dt * newAcceleration[_i2];
            } // Filter, adherence
            var adherence = entity.adherence;
            for (var _i3 = 0; _i3 < 3; ++_i3) {
                if (newSpeed[_i3] < 0 && adherence[_i3] || newSpeed[_i3] > 0 && adherence[3 + _i3]) {
                    newSpeed[_i3] = 0;
                }
            }

            // Update properties, phase 1
            entity.speed = newSpeed;
            entity._impulseSpeed = impulseSpeed;
            entity.acceleration = newAcceleration;

            // Detect movement
            if (newSpeed[0] === 0 && newSpeed[1] === 0 && newSpeed[2] === 0) return false;

            // Guess new position without constraints.
            var newPosition = [position[0], position[1], position[2]];
            for (var _i4 = 0; _i4 < 3; ++_i4) {
                newPosition[_i4] += 0.1 * speed[_i4] * dt;
            } // Update properties, phase 2.
            _terrain2.default.linearCollide(entity, world, position, newPosition, dt);

            // Notify an entity was updated.
            return true;
        }

        // Second-order integrator (time-reversible, symplectic)
        // @returns {boolean} whether entity has updated

    }, {
        key: 'integrateLeapfrog',
        value: function integrateLeapfrog(dt, impulseSpeed, force, entity, EM, world) {
            var mass = entity.mass;

            var position = entity.position;
            var speed = entity.speed;
            var acceleration = entity.acceleration;

            //let previousImpulseSpeed = entity._impulseSpeed;
            //if (!Integrator.areEqual(previousImpulseSpeed, impulseSpeed)) {
            //    for (let i = 0; i < 3; ++i) speed[i] = speed[i] + impulseSpeed[i] - previousImpulseSpeed[i];
            //}

            // Guess new position without constraints.
            var newPosition = [position[0], position[1], position[2]];
            for (var i = 0; i < 3; ++i) {
                newPosition[i] += 0.1 * dt * (speed[i] + acceleration[i] * dt * 0.5);
            } // Detect change in position.
            if (Integrator.areEqual(newPosition, position)) return false;

            if (_terrain2.default.linearCollide(entity, world, position, newPosition, dt)) {
                // entity.speed = determined by the collider
                // entity.acceleration[2] = -0.11;
                //let newAcceleration = [0, 0, 0];
                //if (mass > 0) for (let i = 0; i < 3; ++i) newAcceleration[i] = force[i] / mass;
                //entity.acceleration = newAcceleration;
                entity.speed[0] = entity._impulseSpeed[0];
                entity.speed[1] = entity._impulseSpeed[1];
            } else {

                // Update acceleration
                var newAcceleration = [0, 0, 0];
                if (mass > 0) {
                    for (var _i5 = 0; _i5 < 3; ++_i5) {
                        newAcceleration[_i5] = force[_i5] / mass;
                    }
                }

                // Update speed
                var newSpeed = [speed[0], speed[1], speed[2]];
                var previousImpulseSpeed = entity._impulseSpeed;
                if (!Integrator.areEqual(previousImpulseSpeed, impulseSpeed)) {
                    for (var _i6 = 0; _i6 < 3; ++_i6) {
                        newSpeed[_i6] = newSpeed[_i6] + impulseSpeed[_i6] - previousImpulseSpeed[_i6];
                    }
                }
                for (var _i7 = 0; _i7 < 3; ++_i7) {
                    newSpeed[_i7] += dt * (newAcceleration[_i7] + acceleration[_i7]) / 2;
                } // Leapfrog

                // Update properties
                entity.speed = newSpeed;
                entity.acceleration = newAcceleration;
            }

            entity._impulseSpeed = impulseSpeed;

            // Notify an entity was updated.
            return true;
        }

        // TODO [MEDIUM] Verlet integrator

    }]);
    return Integrator;
}();

exports.default = Integrator;
//# sourceMappingURL=integrator.js.map
