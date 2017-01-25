/**
 * Render target hierarchy management helper.
 */

'use strict';

/*
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

App.Model.Server.XModel.WorldMap = function(xModel) {
    this.xModel = xModel;

    this.xGraph = null;
    this.string = '';
    this.needsUpdate = true;
};

extend(App.Model.Server.XModel.WorldMap.prototype, {

    computeWorldMap: function() {
        var portals = this.xModel.portals;
        var starterWorldId = this.xModel.selfModel.worldId;

        // Map worlds to portals.
        // var worldIdToPortalId = this.worldToPortals;
        var xGraph = new XGraph(parseInt(starterWorldId));

        var forwardPortalId, forwardPortal, forwardWorldId, currentWorldId;

        portals.forEach(function(portal, portalId) {
            currentWorldId = portal.worldId;
            forwardPortalId = portal.portalLinkedForward;
            if (!forwardPortalId) return;
            forwardPortal = portals.get(forwardPortalId);
            if (!forwardPortal) return;
            forwardWorldId = forwardPortal.worldId;
            xGraph.insertNode(parseInt(portalId), parseInt(forwardWorldId), parseInt(currentWorldId));
        });

        this.xGraph = xGraph;
        this.needsUpdate = false;
    },

    invalidate: function() {
        this.needsUpdate = true;
    },

    // Representation
    renderString: function() {
        this.computeWorldMap();
        this.string = this.xGraph.toString();
        this.needsUpdate = false;
        return this.string;
    },

    toString: function() {
        if (this.needsUpdate) this.renderString();
        return this.string;
    }

});
