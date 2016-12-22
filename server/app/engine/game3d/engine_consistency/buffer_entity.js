/**
 *
 */

'use strict';

class EntityBuffer {

    constructor() {
        this._addedPlayers = new Set();
        this._removedPlayers = new Set();
        this._outputBuffer = new Map();
    }

    get addedPlayers()      { return this._addedPlayers; }
    get removedPlayers()    { return this._removedPlayers; }

    spawnPlayer(player) {
        let removedPlayers = this._removedPlayers;
        let id = player.avatar.id;
        if (removedPlayers.has(id)) removedPlayers.delete(id);
        else this._addedPlayers.add(player.avatar.id);
    }

    removePlayer(player) {
        let addedPlayers = this._addedPlayers;
        let id = player.avatar.id;
        if (addedPlayers.has(id)) addedPlayers.delete(id);
        else this._removedPlayers.add(player.avatar.id);
    }

    // addedEntities:   entity id => {p:e.position, r:e.rotation, k:e.kind}
    // removedEntities: entity id => null
    updateEntitiesForPlayer(playerId, addedEntities, removedEntities) {
        // Check.
        if (!addedEntities && !removedEntities) return;
        if (addedEntities && removedEntities) Object.assign(addedEntities, removedEntities); // Aggregate.
        else if (removedEntities) addedEntities = removedEntities;

        // Output.
        this._outputBuffer.set(playerId, addedEntities);
    }

    // Shallow.
    getOutput() {
        return new Map(this._outputBuffer);
    }

    flush() {
        this._outputBuffer = new Map();
        this._addedPlayers = new Set();
        this._removedPlayers = new Set();
    }

}

export default EntityBuffer;
