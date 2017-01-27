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

var TerrainCollider = function () {
    function TerrainCollider() {
        (0, _classCallCheck3.default)(this, TerrainCollider);
    }

    (0, _createClass3.default)(TerrainCollider, null, [{
        key: 'linearCollide',


        /**
         * @returns 'has collided'
         */
        value: function linearCollide(entity, world, position, newPosition, dt) {

            // Intersect on first Non-Free Block
            if (TerrainCollider.intersectAmanditesWoo(position, newPosition, world, entity, function (world, entity, // objects
            i, j, k, // next voxel coordinates
            tMaxX, tMaxY, tMaxZ, // current value of t at which p1p2 crosses (x,y,z) orth. comp.
            tDeltaX, tDeltaY, tDeltaZ, // delta between crosses on orth. comp.
            dx, dy, dz, // orth. directions of p1p2
            x1, y1, z1, // starting point
            x2, y2, z2, // ending point
            ntx, nty, ntz // last orth. to be updated (current shift coordinate)
            ) {

                if (world.isFree([i, j, k])) return false;

                // Collision
                // Damping on first encountered NFB (collision later on)

                var tol = .001;
                var nx0 = dx > 0 ? i - tol : i + 1 + tol;
                var ny0 = dy > 0 ? j - tol : j + 1 + tol;
                var nz0 = dz > 0 ? k - tol : k + 1 + tol;
                var newPosition = [0, 0, 0];
                var oldAdherence = [false, false, false, false, false, false];
                for (var ii = 0; ii < 6; ++ii) {
                    oldAdherence[ii] = entity.adherence[ii];
                }

                if (ntx) {
                    var t = tMaxX - tDeltaX;
                    var ddx = dx < 0 ? 1 : -1;

                    // Projections
                    var ny = y1 + (y2 - y1);
                    var nyt = y1 + (y2 - y1) * t;
                    var dby = Math.abs(Math.floor(ny) - Math.floor(nyt));
                    if (dby < 2) {
                        if (dy < 0) {
                            var free = world.isFree([i + ddx, j - 1, k]);
                            if (!free && dby < 1 && ny > ny0 - 1 || free) {
                                nyt = ny;entity.adherence[1] = false;
                            } else {
                                nyt = ny0 - 1;if (dby > 0 && !free) entity.adherence[1] = true;
                            }
                        }
                        if (dy > 0) {
                            var _free = world.isFree([i + ddx, j + 1, k]);
                            if (!_free && dby < 1 && ny < ny0 + 1 || _free) {
                                nyt = ny;entity.adherence[4] = false;
                            } else {
                                nyt = ny0 + 1;if (dby > 0 && !_free) entity.adherence[4] = true;
                            }
                        }
                    }

                    var nz = z1 + (z2 - z1);
                    var nzt = z1 + (z2 - z1) * t;
                    var dbz = Math.abs(Math.floor(nz) - Math.floor(nzt));
                    if (dbz < 2) {
                        if (dz < 0) {
                            var _free2 = world.isFree([i + ddx, j, k - 1]);
                            if (!_free2 && dbz < 1 && nz > nz0 - 1 || _free2) {
                                nzt = nz;entity.adherence[2] = false;
                            } else {
                                nzt = nz0 - 1;if (dbz > 0 && !_free2) entity.adherence[2] = true;
                            }
                        }
                        if (dz > 0) {
                            var _free3 = world.isFree([i + ddx, j, k + 1]);
                            if (!_free3 && dbz < 1 && nz < nz0 + 1 || _free3) {
                                nzt = nz;entity.adherence[5] = false;
                            } else {
                                nzt = nz0 + 1;if (dbz > 0 && !_free3) entity.adherence[5] = true;
                            }
                        }
                    }

                    if (dx < 0) entity.adherence[0] = true;else if (dx > 0) entity.adherence[3] = true;

                    newPosition = [nx0, nyt, nzt];
                    // entity.acceleration[0] = 0;
                    entity.speed[0] = 0;
                    entity.speed[1] = entity._impulseSpeed[1];
                    if (entity.acceleration[2] === 0) entity.speed[2] = 0;
                } else if (nty) {
                    var _t = tMaxY - tDeltaY;
                    var ddy = dy < 0 ? 1 : -1;

                    var nx = x1 + (x2 - x1);
                    var nxt = x1 + (x2 - x1) * _t;
                    var dbx = Math.abs(Math.floor(nx) - Math.floor(nxt));
                    if (dbx < 2) {
                        if (dx < 0) {
                            var _free4 = world.isFree([i - 1, j + ddy, k]);
                            if (!_free4 && dbx < 1 && nx > nx0 - 1 || _free4) {
                                nxt = nx;entity.adherence[0] = false;
                            } else {
                                nxt = nx0 - 1;if (dbx > 0 && !_free4) entity.adherence[0] = true;
                            }
                        }
                        if (dx > 0) {
                            var _free5 = world.isFree([i + 1, j + ddy, k]);
                            if (!_free5 && dbx < 1 && nx < nx0 + 1 || _free5) {
                                nxt = nx;entity.adherence[3] = false;
                            } else {
                                nxt = nx0 + 1;if (dbx > 0 && !_free5) entity.adherence[3] = true;
                            }
                        }
                    }

                    var _nz = z1 + (z2 - z1);
                    var _nzt = z1 + (z2 - z1) * _t;
                    var _dbz = Math.abs(Math.floor(_nz) - Math.floor(_nzt));
                    if (_dbz < 2) {
                        if (dz < 0) {
                            var _free6 = world.isFree([i, j + ddy, k - 1]);
                            if (!_free6 && _dbz < 1 && _nz > nz0 - 1 || _free6) {
                                _nzt = _nz;entity.adherence[2] = false;
                            } else {
                                _nzt = nz0 - 1;if (_dbz > 0 && !_free6) entity.adherence[2] = true;
                            }
                        }
                        if (dz > 0) {
                            var _free7 = world.isFree([i, j + ddy, k + 1]);
                            if (!_free7 && _dbz < 1 && _nz < nz0 + 1 || _free7) {
                                _nzt = _nz;entity.adherence[5] = false;
                            } else {
                                _nzt = nz0 + 1;if (_dbz > 0 && !_free7) entity.adherence[5] = true;
                            }
                        }
                    }

                    if (dy < 0) entity.adherence[1] = true;else if (dy > 0) entity.adherence[4] = true;

                    newPosition = [nxt, ny0, _nzt];
                    // entity.acceleration[1] = 0;
                    entity.speed[0] = entity._impulseSpeed[0];
                    entity.speed[1] = 0;
                    if (entity.acceleration[2] === 0) entity.speed[2] = 0;
                } else if (ntz) {
                    var _t2 = tMaxZ - tDeltaZ;
                    var ddz = dz < 0 ? 1 : -1;

                    var _nx = x1 + (x2 - x1);
                    var _nxt = x1 + (x2 - x1) * _t2;
                    var _dbx = Math.abs(Math.floor(_nx) - Math.floor(_nxt));
                    if (_dbx < 2) {
                        if (dx < 0) {
                            var _free8 = world.isFree([i - 1, j, k + ddz]);
                            if (!_free8 && _dbx < 1 && _nx > nx0 - 1 || _free8) {
                                _nxt = _nx;entity.adherence[0] = false;
                            } else {
                                _nxt = nx0 - 1;if (_dbx > 0 && !_free8) entity.adherence[0] = true;
                            }
                        }
                        if (dx > 0) {
                            var _free9 = world.isFree([i + 1, j, k + ddz]);
                            if (!_free9 && _dbx < 1 && _nx < nx0 + 1 || _free9) {
                                _nxt = _nx;entity.adherence[3] = false;
                            } else {
                                _nxt = nx0 + 1;if (_dbx > 0 && !_free9) entity.adherence[3] = true;
                            }
                        }
                    }

                    var _ny = y1 + (y2 - y1);
                    var _nyt = y1 + (y2 - y1) * _t2;
                    var _dby = Math.abs(Math.floor(_ny) - Math.floor(_nyt));
                    if (_dby < 2) {
                        if (dy < 0) {
                            var _free10 = world.isFree([i, j - 1, k + ddz]);
                            if (!_free10 && _dby < 1 && _ny > ny0 - 1 || _free10) {
                                _nyt = _ny;entity.adherence[1] = false;
                            } else {
                                _nyt = ny0 - 1;if (_dby > 0 && !_free10) entity.adherence[1] = true;
                            }
                        }
                        if (dy > 0) {
                            var _free11 = world.isFree([i, j + 1, k + ddz]);
                            if (!_free11 && _dby < 1 && _ny < ny0 + 1 || _free11) {
                                _nyt = _ny;entity.adherence[4] = false;
                            } else {
                                _nyt = ny0 + 1;if (_dby > 0 && !_free11) entity.adherence[4] = true;
                            }
                        }
                    }

                    // One impulse allowed
                    if (dz < 0) entity.adherence[2] = true;else if (dz > 0) entity.adherence[5] = true;

                    newPosition = [_nxt, _nyt, nz0];
                    // entity.acceleration[2] = 0;
                    entity.speed = entity._impulseSpeed;
                    entity.speed[2] = 0;
                }

                // Bounce
                // entity.speed[2] = -(entity.speed[2]-entity._impulseSpeed[2]);
                // entity.acceleration = [0, 0, 0]; // Use Euler with collisions
                for (var _ii = 0; _ii < 3; ++_ii) {

                    //if (ltNew && entity.adherence[ii]) {
                    //    entity.position[ii] = Math.floor(entity.position[ii])+tol;
                    //} else if (gtNew && entity.adherence[ii+3]) {
                    //    entity.position[ii] = Math.ceil(entity.position[ii])-tol;
                    //} else {
                    //    entity.position[ii] = newPosition[ii];
                    //}

                    //if (entity.adherence[ii] && newPosition[ii] > entity.position[ii]) entity.adherence[ii] = false;
                    //if (entity.adherence[3+ii] && newPosition[ii] < entity.position[ii]) entity.adherence[3+ii] = false;
                    if (newPosition[_ii] < entity.position[_ii] && oldAdherence[_ii]) continue;
                    if (newPosition[_ii] > entity.position[_ii] && oldAdherence[3 + _ii]) continue;
                    entity.position[_ii] = newPosition[_ii];

                    //entity.adherence[ii+ (ltNew ? 0 : 3)] = false;
                }

                return true;
            })) return true;

            // Update entity position.
            //entity.position = newPosition;
            for (var ii = 0; ii < 3; ++ii) {
                if (entity.adherence[ii] && newPosition[ii] > entity.position[ii]) entity.adherence[ii] = false;
                if (entity.adherence[3 + ii] && newPosition[ii] < entity.position[ii]) entity.adherence[3 + ii] = false;

                //if (entity.adherence[ii] && newPosition[ii] < entity.position[ii]) continue;
                //if (entity.adherence[3+ii] && newPosition[ii] > entity.position[ii]) continue;

                entity.position[ii] = newPosition[ii];
                //entity.adherence[ii] = false;
                //entity.adherence[ii+3] = false;
            }

            return false;
        }
    }, {
        key: 'intersectAmanditesWoo',
        value: function intersectAmanditesWoo(p1, p2, world, entity, callback) {

            var sgn = function sgn(x) {
                return x > 0 ? 1 : x < 0 ? -1 : 0;
            };
            var frac0 = function frac0(x) {
                return x - Math.floor(x);
            };
            var frac1 = function frac1(x) {
                return 1.0 - x + Math.floor(x);
            };
            var min = function min(x, y) {
                return Math.min(x, y);
            };

            var x1 = p1[0];var x2 = p2[0];
            var y1 = p1[1];var y2 = p2[1];
            var z1 = p1[2];var z2 = p2[2];

            // p1p2 is parametrized as p(t) = p1 + (p2-p1)*t
            // tDeltaX def. how far one has to move, in units of t, s. t. the horiz. comp. of the mvt. eq. the wdth. of a v.
            // tMaxX def. the value of t at which (p1p2) crosses the first (then nth) vertical boundary.
            var tMaxX = void 0,
                tMaxY = void 0,
                tMaxZ = void 0,
                tDeltaX = void 0,
                tDeltaY = void 0,
                tDeltaZ = void 0;
            var ntx = false,
                nty = false,
                ntz = false;

            var threshold = 10000000.0;

            var dx = sgn(x2 - x1);
            var i = Math.floor(x1);
            if (dx != 0) tDeltaX = min(dx / (x2 - x1), threshold);else tDeltaX = threshold;
            if (dx > 0) tMaxX = tDeltaX * frac1(x1);else tMaxX = tDeltaX * frac0(x1);

            var dy = sgn(y2 - y1);
            var j = Math.floor(y1);
            if (dy != 0) tDeltaY = min(dy / (y2 - y1), threshold);else tDeltaY = threshold;
            if (dy > 0) tMaxY = tDeltaY * frac1(y1);else tMaxY = tDeltaY * frac0(y1);

            var dz = sgn(z2 - z1);
            var k = Math.floor(z1);
            if (dz != 0) tDeltaZ = min(dz / (z2 - z1), threshold);else tDeltaZ = threshold;
            if (dz > 0) tMaxZ = tDeltaZ * frac1(z1);else tMaxZ = tDeltaZ * frac0(z1);

            while (tMaxX <= 1 || tMaxY <= 1 || tMaxZ <= 1) {
                if (tMaxX < tMaxY) {
                    if (tMaxX < tMaxZ) {
                        i += dx;
                        tMaxX += tDeltaX;
                        ntx = true;nty = false;ntz = false;
                    } else {
                        k += dz;
                        tMaxZ += tDeltaZ;
                        ntx = false;nty = false;ntz = true;
                    }
                } else {
                    if (tMaxY < tMaxZ) {
                        j += dy;
                        tMaxY += tDeltaY;
                        ntx = false;nty = true;ntz = false;
                    } else {
                        k += dz;
                        tMaxZ += tDeltaZ;
                        ntx = false;nty = false;ntz = true;
                    }
                }

                if (callback(world, entity, // objects
                i, j, k, // next voxel coordinates
                tMaxX, tMaxY, tMaxZ, // current value of t at which p1p2 crosses (x,y,z) orth. comp.
                tDeltaX, tDeltaY, tDeltaZ, // delta between crosses on orth. comp.
                dx, dy, dz, // orth. directions of p1p2
                x1, y1, z1, // starting point
                x2, y2, z2, // ending point
                ntx, nty, ntz // last orth. to be updated (current shift coordinate)
                )) return true;
            }

            // No collision
            return false;
        }
    }]);
    return TerrainCollider;
}();

exports.default = TerrainCollider;
//# sourceMappingURL=terrain.js.map
