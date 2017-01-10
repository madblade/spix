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

        // Cached requests
        this._cachedConnectivity = new Map(); // WorldId+ChunkId -> portals ids.
        // To update whenever avatar moves from one chunk to another.
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
            if (ctpc) {
                ctpc.add(portalId);
            }
            else {
                ctpc = new Set();
                ctpc.add(portalId);
                wtpc.set(chunkId, ctpc);
            }
        } else {
            wtpc = new Map();
            ctpc = new Set();
            ctpc.add(portalId);
            wtpc.set(chunkId, ctpc);
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

        this._cachedConnectivity = new Map();
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
        this._cachedConnectivity = new Map();
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
        portalId = parseInt(portalId);
        return this._portals.get(portalId);
    }

    chunkContainsPortal(worldId, chunkId, portalId) {
        // portalId = parseInt(portalId);
        worldId = parseInt(worldId);
        let ctp = this._worldToChunksToPortals.get(worldId);
        if (!ctp) return false;
        let p = ctp.get(chunkId);
        if (!p) return false;
        return p.has(portalId);
    }

    getPortalsFromChunk(worldId, chunkId) {
        worldId = parseInt(worldId);
        let ctp = this._worldToChunksToPortals.get(worldId);
        if (!ctp) return null;
        return ctp.get(chunkId);
    }

    getOtherSide(portalId) {
        portalId = parseInt(portalId);
        let p = this._portals.get(portalId);
        if (!p) return;
        let k = this._portalsToKnots.get(portalId);
        if (!k) return;
        return k.otherEnd(p);
    }

    // Returns a Map portalId -> [otherEndId, otherWorldId]
    // TODO [CRIT] CACHE RESULTS AND INVALIDATE AT XMODEL TRANSACTION
    // TODO [CRIT] continue here
    getConnectivity(chunk, wModel, thresh) {

        // Request cache.
        let originChunkId = chunk.chunkId;
        let worldId = chunk.world.worldId;
        let aggregate = worldId + originChunkId;
        let cached = this._cachedConnectivity.get(aggregate);
        if (cached) return cached;

        var result = new Map();

        // BFS.
        let marks = new Set();
        let depth = 0;
        let stack = [[chunk, depth]];
        while (stack.length > 0 && depth < thresh) {
            let element = stack.shift();
            let currentChunk = element[0];
            let currentDepth = element[1];
            let wid = currentChunk.world.worldId;
            let chunkId = currentChunk.chunkId;

            let marksId = wid + chunkId;
            if (marks.has(marksId)) continue;
            marks.add(marksId);
            console.log(chunkId);

            depth = currentDepth;
            console.log(depth);
            let world = wModel.getWorld(wid);
            let ijk = chunkId.split(',');
            let i = parseInt(ijk[0]), j = parseInt(ijk[1]), k = parseInt(ijk[2]);
            let chks = [
                world.getChunk(i+1, j, k), world.getChunk(i-1, j, k),
                world.getChunk(i, j+1, k), world.getChunk(i, j-1, k),
                world.getChunk(i, j, k+1), world.getChunk(i, j, k-1)
            ];
            let ok = true;
            chks.forEach(c => { if (c) {
                stack.push([c, currentDepth+1]);
            } else { ok = false; }});
            //if (!ok) return new Map();
            let gates = this.getPortalsFromChunk(wid, chunkId);
            if (gates) {
                gates.forEach(g => {
                    let currentPortal = this.getPortal(g);
                    let otherSide = this.getOtherSide(g);
                    if (!otherSide) return;
                    let otherChunk = otherSide.chunk;
                    console.log("origin: world " + currentPortal.worldId + ", portal " + currentPortal.id);
                    console.log("destin: world " + otherSide.worldId + ", portal " + otherSide.id);
                    result.set(g, [otherSide.id, currentPortal.chunkId, currentPortal.worldId, ...currentPortal.state]);
                    if (otherChunk) stack.push([otherChunk, currentDepth+1]);
                });
            }

            stack.sort((a, b) => a[1] - b[1]);
        }

        console.log(result);
        this._cachedConnectivity.set(aggregate, result);
        return result;
    }

}

export default XModel;
