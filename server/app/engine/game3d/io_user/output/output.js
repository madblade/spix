/**
 *
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _stringify = require("babel-runtime/core-js/json/stringify");

var _stringify2 = _interopRequireDefault(_stringify);

var _assign = require("babel-runtime/core-js/object/assign");

var _assign2 = _interopRequireDefault(_assign);

var _keys = require("babel-runtime/core-js/object/keys");

var _keys2 = _interopRequireDefault(_keys);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var UserOutput = function () {
    function UserOutput(game) {
        (0, _classCallCheck3.default)(this, UserOutput);

        this._game = game;

        this._physicsEngine = game.physicsEngine;
        this._topologyEngine = game.topologyEngine;
        this._consistencyEngine = game.consistencyEngine;
    }

    (0, _createClass3.default)(UserOutput, [{
        key: "update",


        // TODO [HIGH] -> don't recurse over every player, rather over updates...
        value: function update() {
            var t1 = void 0,
                t2 = void 0;

            t1 = process.hrtime();
            //this.spawnPlayers();
            t2 = process.hrtime(t1)[1] / 1000;
            if (UserOutput.bench && t2 > 1000) console.log(t2 + " µs to spawn players.");

            t1 = process.hrtime();
            this.updateChunks();
            t2 = process.hrtime(t1)[1] / 1000;
            if (UserOutput.bench && t2 > 1000) console.log(t2 + " µs to send chunk updates.");

            t1 = process.hrtime();
            this.updateEntities();
            t2 = process.hrtime(t1)[1] / 1000;
            if (UserOutput.bench && t2 > 1000) console.log(t2 + " µs to send entity updates.");

            t1 = process.hrtime();
            this.updateX();
            t2 = process.hrtime(t1)[1] / 1000;
            if (UserOutput.bench && t2 > 1000) console.log(t2 + " µs to send x updates.");

            t1 = process.hrtime();
            this.updateMeta();
            t2 = process.hrtime(t1)[1] / 1000;
            if (UserOutput.bench && t2 > 1000) console.log(t2 + " µs to send other stuff.");

            this._consistencyEngine.flushBuffers();
        }

        // Every player spawns in initial world '-1'.

    }, {
        key: "spawnPlayers",
        value: function spawnPlayers() {
            var consistencyEngine = this._consistencyEngine;
            var addedPlayers = consistencyEngine.getPlayerOutput();
            var game = this._game;
            var players = game.players;

            addedPlayers.forEach(function (pid) {
                var player = players.getPlayerFromId(pid);
                if (player) {
                    var p = player,
                        a = p.avatar;

                    // Load chunks.
                    // Format: {worldId: {chunkId: [fastComps, fastCompIds]}}
                    var chunks = consistencyEngine.initChunkOutputForPlayer(p);
                    p.send('chk', UserOutput.pack(chunks));

                    // Load entities.
                    // Format: {entityId: {p:pos, r:rot, k:kind}
                    var entities = consistencyEngine.initEntityOutputForPlayer(p);
                    p.send('ent', UserOutput.pack([a.position, a.rotation, entities]));

                    if (UserOutput.debug) console.log('Init a new player on game ' + game.gameId + '.');
                }
            });
        }
    }, {
        key: "updateChunks",
        value: function updateChunks() {
            var game = this._game;
            var topologyEngine = this._topologyEngine;
            var consistencyEngine = this._consistencyEngine;

            var updatedChunks = topologyEngine.getOutput();
            var consistencyOutput = consistencyEngine.getChunkOutput();

            game.players.forEach(function (p) {
                if (p.avatar) {
                    var hasNew = void 0,
                        hasUpdated = void 0;
                    var pid = p.avatar.id;

                    // TODO [LOW] check 'player has updated position'
                    // TODO [MEDIUM] dynamically remove chunks with GreyZone, serverside
                    // player id -> changes (world id -> chunk id -> changes)
                    var addedOrRemovedChunks = consistencyOutput.get(pid);
                    hasNew = addedOrRemovedChunks && (0, _keys2.default)(addedOrRemovedChunks).length > 0;

                    var updatedChunksForPlayer = topologyEngine.getOutputForPlayer(p, updatedChunks, addedOrRemovedChunks);
                    hasUpdated = updatedChunksForPlayer && (0, _keys2.default)(updatedChunksForPlayer).length > 0;

                    if (hasNew) {
                        // New chunk + update => bundle updates with new chunks in one call.
                        if (hasUpdated) {
                            for (var wiA in addedOrRemovedChunks) {
                                if (wiA in updatedChunksForPlayer) {
                                    (0, _assign2.default)(addedOrRemovedChunks[wiA], updatedChunksForPlayer[wiA]);
                                    delete updatedChunksForPlayer[wiA];
                                }
                            }

                            (0, _assign2.default)(addedOrRemovedChunks, updatedChunksForPlayer);
                        }

                        // Format:
                        // {
                        //  'worlds': {worldId:[x,y,z]} ............... World metadata
                        //  worldId:
                        //      {chunkId: [fastCC, fastCCId]} ......... Added chunk
                        //      {chunkId: [removed, added, updated]} .. Updated chunk
                        //      {chunkId: null} ....................... Removed chunk
                        // }

                        var output = UserOutput.pack(addedOrRemovedChunks);
                        p.send('chk', output);
                        // TODO [CRIT] check appearance of []
                        // for (let wiA in addedOrRemovedChunks) console.log(Object.keys(addedOrRemovedChunks[wiA]));
                    } else if (hasUpdated) {
                            // (Format: ditto)
                            // If only an update occurred on an existing, loaded chunk.
                            var _output = UserOutput.pack(updatedChunksForPlayer);
                            p.send('chk', _output);
                        }
                }
            });

            // Empty chunk updates buffer.
            topologyEngine.flushOutput();
        }
    }, {
        key: "updateEntities",
        value: function updateEntities() {
            var game = this._game;
            var physicsEngine = this._physicsEngine;
            var consistencyEngine = this._consistencyEngine;

            var updatedEntities = physicsEngine.getOutput();
            var consistencyOutput = consistencyEngine.getEntityOutput();

            if (updatedEntities.size < 1) return;

            // Broadcast updates.
            // TODO [HIGH] bundle update in one chunk.
            game.players.forEach(function (p) {
                var pid = p.avatar.id;

                // If an entity in range of player p has just updated.
                var addedOrRemovedEntities = consistencyOutput.get(pid);

                // Consistency output SIMULATES UPDATED ENTITIES AS NEW ENTITIES.
                // Rapidly checked client-side, it prevents from using YET ANOTHER CALL to physicsEngine
                // and to compute distances between entities.
                //let updatedEntities = physicsEngine.getOutputForPlayer(p, updatedEntities);

                // TODO [LOW] detect change in position since the last time.
                // if (!entities), do it nevertheless, for it gives the player its own position.
                // Format:
                // [myPosition, myRotation, {
                //  entityId:
                //      null .................. removed entity
                //      {p: [], r:[], k:''} ... added or updated entity
                // }]
                p.send('ent', UserOutput.pack([p.avatar.position, p.avatar.rotation, addedOrRemovedEntities]));
            });

            // Empty entity updates buffer.
            physicsEngine.flushOutput();
        }
    }, {
        key: "updateX",
        value: function updateX() {
            var game = this._game;
            var consistencyEngine = this._consistencyEngine;
            var xOutput = consistencyEngine.getXOutput();

            game.players.forEach(function (p) {
                var pid = p.avatar.id;
                var addedOrRemovedX = xOutput.get(pid);

                if (addedOrRemovedX && (0, _keys2.default)(addedOrRemovedX).length > 0) {
                    var output = UserOutput.pack(addedOrRemovedX);

                    // Format:
                    // {portalId:
                    //  null ....................................... removed portal
                    //  [otherId, chunkId, worldId, ...state] ...... new or updated portal
                    // }
                    p.send('x', output);
                }
            });

            // TODO [HIGH] when x updates are implemented.
            // xEngine.flushOutput();
        }
    }, {
        key: "updateMeta",
        value: function updateMeta() {
            var game = this._game;
            game.chat.updateOutput();
        }
    }], [{
        key: "pack",
        value: function pack(message) {
            return (0, _stringify2.default)(message);
        }
    }]);
    return UserOutput;
}();

UserOutput.debug = false;
UserOutput.bench = false;
exports.default = UserOutput;
//# sourceMappingURL=output.js.map
