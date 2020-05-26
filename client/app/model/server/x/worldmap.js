/**
 * Render target hierarchy management helper.
 */

'use strict';

/*
 * Does not display stubs.
 *
 *  w0
 *  ├─ w1        | p1 -> p1'
 *  │   ├─ w3   | p3 -> p3'
 *  │   ├─ w4   | p4 -> p4'
 *  │   └─ w5   | p5 -> p5'
 *  └─ w2        | p2 -> p2'
 *      ├─ w5    | p5 -> p5'
 *      ├─ w6    | p6 -> p6'
 *      └─ w0    | p7 -> p7'
 *
 * red: rewired backwards
 * cyan: contains direct circle
 * orange: duplicated
 * green: linear
 *
 */

import extend           from '../../../extend.js';

import { XGraph }       from './tree.js';

let WorldMap = function(xModel) {
    this.xModel = xModel;

    this.xGraph = null;
    this.string = '';
    this.needsUpdate = true;
};

extend(WorldMap.prototype, {

    switchRoot(oldRootId, newRootId) {
        this.xGraph.switchRoot(oldRootId, newRootId);
        this.invalidate();
    },

    computeWorldMap() {
        let portals = this.xModel.portals;
        let starterWorldId = this.xModel.selfModel.worldId;

        let xGraph = new XGraph(parseInt(starterWorldId, 10));

        let forwardPortalId;
        let forwardPortal;
        let forwardWorldId;
        let currentWorldId;

        portals.forEach(function(portal, portalId) {
            currentWorldId = portal.worldId;
            forwardPortalId = portal.portalLinkedForward;
            if (!forwardPortalId) return;
            forwardPortal = portals.get(forwardPortalId);
            if (!forwardPortal) return;
            forwardWorldId = forwardPortal.worldId;

            xGraph.insertNode(
                parseInt(portalId, 10),
                parseInt(forwardPortalId, 10),
                parseInt(forwardWorldId, 10),
                parseInt(currentWorldId, 10)
            );
        });

        this.xGraph = xGraph;
        return this;
    },

    computeFlatGraph() {
        return this.xGraph.computeFlatGraph();
    },

    computeRenderingGraph(graphicsEngine) {
        return this.xGraph.computeRenderingGraph(graphicsEngine, this.xModel);
    },

    invalidate() {
        this.needsUpdate = true;
        return this;
    },

    // Representation
    renderString() {
        this.computeWorldMap();
        this.xGraph.computeFlatGraph();
        this.string = this.xGraph.toString();
        this.needsUpdate = false;
        return this.string;
    },

    toString() {
        if (this.needsUpdate) this.renderString();
        return this.string;
    }

});

export { WorldMap };
