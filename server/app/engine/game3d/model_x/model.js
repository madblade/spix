/**
 *
 */

'use strict';

import Knot             from './knot';
import Portal           from './portal';

import CollectionUtils  from '../../math/collections';
import GeometryUtils    from '../../math/geometry';

// TODO [CRIT] OK I know it's not right to put that here
import WorldGenerator   from '../engine_consistency/generator/worldgenerator';

class XModel {

    constructor(game) {
        this._game = game;
        this._worldModel = game.worldModel;

        // Database
        this._knots = new Map();
        this._portals = new Map();

        // world id => [map: chunk id => array of portals]
        // TODO [LONG-TERM] optimize by sorting.
        this._worldToChunksToPortals = new Map();

        // Portal id => knots
        this._portalsToKnots = new Map();
    }

    /** Create / link **/

    // One knows it must link parts of this knots before it opens...
    // OtherPortalId: if null, spawns an empty portal; otherwise, links an existing portal and forge it into a knot.
    addPortal(worldId, x1, y1, z1, x2, y2, z2, position, orientation, otherPortalId) {
        let world = this._worldModel.getWorld(worldId);
        let portals = this._portals;
        let worldToChunksToPortals = this._worldToChunksToPortals;

        // Check parameters.
        // Orientation should be correct.
        if (orientation !== '+' && orientation !== '-' && orientation !== 'both') return;
        // Portal must be orthogonal an axis: exactly one block coordinate in common.
        let bx = x1 === x2, by = y1 === y2, bz = z1 === z2;
        let sum = bx + by + bz;
        if (sum !== 1 && sum !== 2) {
            console.log('Portal not axis-aligned: ' + sum);
            return;
        }
        // Portal minimal size.

        // Check chunks.
        let coords1 = world.getChunkCoordinates(x1, y1, z1);
        let coords2 = world.getChunkCoordinates(x2, y2, z2);
        // Must be on one same chunk. TODO [LONG-TERM] spawn them across chunks.
        let chunk1 = world.getChunk(...coords1);
        let chunk2 = world.getChunk(...coords2);
        if (chunk1 && chunk1 !== chunk2) return;

        let portalId = CollectionUtils.generateId(portals);
        var portal = new Portal(worldId, portalId, [x1, y1, z1], [x2, y2, z2], position, orientation, chunk1);

        let chunkId = chunk1.chunkId;
        portals.set(portalId, portal);
        let wtpc = worldToChunksToPortals.get(worldId), ctpc;
        if (wtpc) {
            ctpc = wtpc.get(chunkId);
            if (ctpc) ctpc.push(portal);
            else wtpc.set(chunkId, [portal]);
        } else {
            wtpc = new Map();
            wtpc.set(chunkId, [portal]);
            worldToChunksToPortals.set(worldId, wtpc);
        }

        if (otherPortalId) {
            this.addKnot(portalId, otherPortalId);
        } else {
            let newWorld = this._worldModel.addWorld();
            if (!newWorld) {
                console.log('Failed to create a new world.');
                return;
            }

            // Force generation and add portal.
            let xS = newWorld.xSize, yS = newWorld.ySize, zS = newWorld.zSize;
            // TODO [CRIT] change worlds here.
            let ijk = chunkId.split(',');
            let newChunk = WorldGenerator.generateFlatChunk(xS, yS, zS, ...ijk, newWorld);
            newWorld.addChunk(newChunk.chunkId, newChunk);
            this.addPortal(newWorld.worldId, x1, y1, z1, x2, y2, z2, position, orientation, portalId);
        }
    }

    // (x1, y1, z1): first block
    // (x2, y2, z2): second block
    // position: percentage of block towards +
    // orientation: '+', '-' or both.
    // One does not know where this one will lead.
    addKnot(portalId1, portalId2) {
        let knots = this._knots;
        let portals = this._portals;
        let portalsToKnots = this._portalsToKnots;

        // Check portals.
        let portal1 = portals.get(portalId1);
        let portal2 = portals.get(portalId2);
        if (!portal1) return;

        // Check already linked.
        if (portalsToKnots.has(portalId1)) return;
        if (portal2 && portalsToKnots.has(portalId2)) return;

        // Create knot & link portals.
        let id = CollectionUtils.generateId(knots);
        var knot = new Knot(id, portal1, portal2);

        // Create in model.
        knots.set(id, knot);
        portalsToKnots.set(knot.portal1.id, knot);
        portalsToKnots.set(knot.portal2.id, knot);

        return knot;
    }

    /** Remove **/

    removePortalFromPosition(worldId, x, y, z) {
        // TODO [CRIT] worldify
    }

    removePortal(portalId) {
        // Unlink and remove portal.
        let portalToKnots = this._portalsToKnots;
        let portals = this._portals;
        let portal = portals.get(portalId);
        if (!portal) return;

        let knot = portalToKnots.get(portalId);

        if (knot) {
            let otherEnd = knot.otherEnd(portal);

            if (otherEnd)
                knot.removePortal(portal);
            else
                this._knots.delete(otherEnd.id);

            portalToKnots.delete(portalId);
        }

        portals.delete(portalId);
    }

    removeKnot(knotId) {
        // Unlink portals.
        let knots = this._knots;
        let portalToKnots = this._portalsToKnots;
        let knot = knots.get(knotId);

        if (knot) {
            let end1 = knot.portal1;
            let end2 = knot.portal2;

            if (end1) { portalToKnots.remove(end1.id); }
            if (end2) { portalToKnots.remove(end2.id); }

            knots.remove(knotId);
        }
    }

    /** Get **/

    getPortal(portalId) {
        return this._portals.get(portalId);
    }

    chunkContainsPortal(worldId, chunkId, portalId) {
        let ctp = this._worldToChunksToPortals.get(worldId);
        if (!ctp) return false;
        let p = ctp.get(chunkId);
        if (!p) return false;
        return p.indexOf(portalId) > -1;
    }

    getPortalsFromChunk(worldId, chunkId) {
        let ctp = this._worldToChunksToPortals.get(worldId);
        if (!ctp) return null;
        return ctp.get(chunkId);
    }

    getOtherSide(portalId) {
        let p = this._portals.get(portalId);
        if (!p) return;
        let k = this._portalsToKnots.get(portalId);
        if (!k) return;
        return k.otherEnd(p);
    }

    // Returns a Map portalId -> [otherEndId, otherWorldId]
    // TODO [CRIT] CACHE RESULTS AND INVALIDATE AT XMODEL TRANSACTION
    getConnectivity(originChunkId, worldId, threshold) {
        // TODO [CRIT] use chunk iterator for neighbour (visible) chunks.
        let chunksToPortals = this._worldToChunksToPortals.get(worldId);

        if (!chunksToPortals || chunksToPortals.size < 1) return;
        var portalsToWorlds = new Map();

        // TODO [CRIT] make it so there it goes through other worlds, & distance increases.
        chunksToPortals.forEach((portals, currentChunkId) => {
            // if (distance(avatar, chunk) < thresh)
                portals.forEach(portal => {
                    let knot = this._portalsToKnots.get(portal.id);
                    if (knot) {
                        let otherPortal = knot.otherEnd(portal);
                        if (otherPortal) // Should always apply.
                        {
                            portalsToWorlds.set(portal.id, [otherPortal.id, otherPortal.worldId]);
                        }
                        else { console.log('There is a portal that is not linked.'); }
                    }
                });
        });

        return portalsToWorlds;
    }

}

export default XModel;
