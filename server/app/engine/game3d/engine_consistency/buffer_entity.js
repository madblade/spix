/**
 *
 */

'use strict';

class EntityBuffer
{
    constructor()
    {
        this._addedPlayers = new Set();
        this._removedPlayers = new Set();
        this._outputBuffer = new Map();
    }

    get addedPlayers()      { return this._addedPlayers; }
    get removedPlayers()    { return this._removedPlayers; }

    spawnPlayer(player)
    {
        let removedPlayers = this._removedPlayers;
        let id = player.avatar.entityId;
        if (removedPlayers.has(id)) removedPlayers.delete(id);
        else this._addedPlayers.add(id);
    }

    removePlayer(playerId)
    {
        let addedPlayers = this._addedPlayers;
        if (addedPlayers.has(playerId)) addedPlayers.delete(playerId);
        else this._removedPlayers.add(playerId);
    }

    // addedEntities:   entity id => {p:e.position, r:e.rotation, k:e.kind}
    // removedEntities: entity id => null
    updateEntitiesForPlayer(playerId, addedEntities, removedEntities)
    {
        // Check.
        if (!(addedEntities && Object.keys(addedEntities).length > 0) &&
            !(removedEntities && Object.keys(removedEntities).length > 0))
            return;
        if (addedEntities && Object.keys(addedEntities).length > 0 &&
            removedEntities && Object.keys(removedEntities).length > 0)
            Object.assign(addedEntities, removedEntities); // Aggregate.
        else if (removedEntities && Object.keys(removedEntities).length > 0)
            addedEntities = removedEntities;

        // Output.
        let o = this._outputBuffer.get(playerId);
        if (!o)
            this._outputBuffer.set(playerId, addedEntities);
        else {
            // Bundle updates
            for (let e in addedEntities) {
                if (!addedEntities.hasOwnProperty(e)) continue;
                o[e] = addedEntities[e];
            }
        }
    }

    // Shallow.
    getOutput()
    {
        return new Map(this._outputBuffer);
    }

    flush()
    {
        this._addedPlayers = new Set();
        this._removedPlayers = new Set();
        this._outputBuffer = new Map();
    }
}

export default EntityBuffer;
