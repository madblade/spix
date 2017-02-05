/**
 *
 */

'use strict';

import Knot             from './knot';
import Portal           from './portal';

import CollectionUtils  from '../../math/collections';
import GeometryUtils    from '../../math/geometry';

import WorldGenerator   from '../engine_consistency/generator/worldgenerator';

class XModel {

    constructor(game) {
        this._game = game;
        this._worldModel = game.worldModel;

        // Database
        this._knots = new Map();
        this._portals = new Map();

        // world id => [map: chunk id => set of portal ids]
        // TODO [LONG-TERM] optimize by sorting.
        this._worldToChunksToPortals = new Map();

        // Portal id => knots
        this._portalsToKnots = new Map();

        // Cached requests
        this._cachedConnectivity = [new Map(), new Map()]; // WorldId+ChunkId -> portals ids.
        // To update whenever avatar moves from one chunk to another.
    }

    static debug = false;

    get portals() { return this._portals; }

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

            // Force generation (1 chunk) and add portal.
            let xS = newWorld.xSize, yS = newWorld.ySize, zS = newWorld.zSize;
            // TODO [HIGH] Maybe it's not right to generate chunks here.
            let ijk = chunkId.split(',');
            let newChunk = WorldGenerator.generateFlatChunk(xS, yS, zS, ...ijk, newWorld);
            newWorld.addChunk(newChunk.chunkId, newChunk);
            this.addPortal(newWorld.worldId, x1, y1, z1, x2, y2, z2, position, orientation, portalId);
        }

        this._cachedConnectivity = [new Map(), new Map()];
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
        // TODO [OPTIM] compute connected components in 4D manifold
        this._cachedConnectivity = [new Map(), new Map()];
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

        // Invalidate cache.
        // THOUGHT [OPTIM] think of a wiser invalidation method.
        this._cachedConnectivity = [new Map(), new Map()];
    }

    /** Get **/

    getPortal(portalId) {
        portalId = parseInt(portalId);
        return this._portals.get(portalId);
    }

    chunkContainsPortal(worldId, chunkId, portalId) {
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
    // THOUGHT 1 [OPTIM] cache deepest request, then filter cached requests from then on

    // THOUGHT 2 [OPTIM] optimize time with memory.
    // Every time a portal is created, you add in an associative map
    // coordinates of both linked chunks (order is important).
    // Then you can compute offsets for two chunks in different worlds (just take
    // min distance by considering all possible combinations of ways going through superposed chunks).
    // A way to do it efficiently is to keep a Voronoi-like structure that emulate a geographical sorting of gates,
    // along with a sorted list of distance further between any pair of 4D subworlds.
    // Affectation can be solved by Munkres' algorithm.
    getConnectivity(startWid, startCid, wModel, thresh, force) {

        if (!force && this._portals.size < 1) return; // Quite often.

        // Request cache.
        let aggregate = startWid + ';' + startCid + ';' + thresh;
        let cached1 = this._cachedConnectivity[0].get(aggregate);
        let cached2 = this._cachedConnectivity[1].get(aggregate);
        if (cached1 && cached2) return [cached1, cached2];

        var recursedPortals = new Map();
        var recursedChunks = [];

        // BFS.
        let marks = new Set();
        let depth = 0;
        let count = 0;
        let stack = [[startWid, startCid, depth]];
        while (stack.length > 0 && depth < thresh) {
            let element = stack.shift();
            let currentWorld = element[0];
            let currentChunk = element[1];
            let currentDepth = element[2];

            let marksId = currentWorld +','+ currentChunk;
            if (marks.has(marksId)) continue;
            marks.add(marksId);
            recursedChunks.push([currentWorld, currentChunk, currentDepth]);
            count++;

            depth = currentDepth;
            let world = wModel.getWorld(currentWorld);
            let ijk = currentChunk.split(',');
            let i = parseInt(ijk[0]), j = parseInt(ijk[1]), k = parseInt(ijk[2]);
            let chks = [
                ((i+1)+','+j+','+k),  ((i-1)+','+j+','+k),
                (i+','+(j+1)+','+k),  (i+','+(j-1)+','+k),
                (i+','+j+','+(k+1)),  (i+','+j+','+(k-1))
            ];

            // TODO [HIGH] discriminate depth k+ and k-
            chks.forEach(c => {
                if (!marks.has(currentWorld + ',' + c)) stack.push([currentWorld, c, currentDepth + 1]);
            });

            let gates = this.getPortalsFromChunk(currentWorld, currentChunk);
            if (gates) {
                gates.forEach(g => {
                    let currentPortal = this.getPortal(g);
                    let otherSide = this.getOtherSide(g);
                    if (!otherSide) {
                        recursedPortals.set(g, [null, currentPortal.chunkId, currentPortal.worldId, ...currentPortal.state]);
                    } else {
                        let otherChunk = otherSide.chunk;
                        if (XModel.debug) console.log("origin: world " + currentPortal.worldId + ", portal " + currentPortal.id);
                        if (XModel.debug) console.log("destin: world " + otherSide.worldId + ", portal " + otherSide.id);
                        recursedPortals.set(g, [otherSide.id, currentPortal.chunkId, currentPortal.worldId, ...currentPortal.state]);
                        if (otherChunk) {
                            let otherWorld = otherChunk.world.worldId;
                            let otherChunkId = otherChunk.chunkId;
                            if (!(marks.has(otherWorld+','+otherChunkId)))
                                stack.push([otherWorld, otherChunkId, currentDepth+1]);
                        }
                    }
                });
            }

            // Usually (always, I think) already sorted.
            // But it's important to keep it sorted. Make sure.
            stack.sort((a, b) => a[2] - b[2]);
        }

        if (XModel.debug) console.log(count + ' iterations on ' + startWid+'/'+startCid+'/'+thresh);

        this._cachedConnectivity[0].set(aggregate, recursedPortals);
        this._cachedConnectivity[1].set(aggregate, recursedChunks);
        return [recursedPortals, recursedChunks];
    }

}

export default XModel;
