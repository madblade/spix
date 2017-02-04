/**
 *
 */

'use strict';

extend(App.Model.Server.XModel.prototype, {

    addPortal: function(portalId, otherPortalId,
                        chunkId, worldId, end1, end2, position, orientation,
                        worldMap)
    {
        var graphics = this.app.engine.graphics;
        console.log('\n\n');
        console.log('Adding portal ' + portalId + ' and linking to ' + otherPortalId);
        portalId = parseInt(portalId);

        // Build portal model.
        if (this.portals.has(portalId)) {
            console.log('Portal ' + portalId + ' was here already...');
        }

        var portal = new App.Model.Server.XModel.Portal(portalId, otherPortalId,
            chunkId, worldId, end1, end2, position, orientation);

        // Add portal to model.
        this.portals.set(portalId, portal);

        // Recompute map for graphics.
        worldMap.invalidate().computeWorldMap();

        // Add to world-portal model.
        var worldPortals = this.worldToPortals.get(worldId);
        if (worldPortals) worldPortals.add(portalId);
        else {
            worldPortals = new Set();
            worldPortals.add(portalId);
            this.worldToPortals.set(worldId, worldPortals);
        }

        // Complete other portals which lead to this one.
        var backwards = this.backwardLinks;
        var backwardsPortals = backwards.get(portalId);
        console.log(backwards);
        console.log(portalId + ', ' + (backwardsPortals?backwardsPortals:'nothing'));
        var portals = this.portals;
        if (backwardsPortals) backwardsPortals.forEach(function(previousPortalId) {
            var previousPortal = portals.get(previousPortalId);
            if (previousPortal) {
                graphics.completeStubPortalObject(previousPortal, portal, worldMap);
            }
        });

        // Register other end to be linked backwards by this one.
        var otherPortal = otherPortalId ? this.portals.get(otherPortalId) : null;
        if (otherPortal) {
            this.addBackwardLink(portalId, otherPortalId);

            // Do add current portal.
            graphics.addPortalObject(portal, otherPortal, worldMap);
        } else {
            if (otherPortalId) {
                this.addBackwardLink(portalId, otherPortalId);

                graphics.addStubPortalObject(portal, otherPortalId);
            } else {
                console.log('Error building stub portal: could not get other end.');
            }
        }

    },

    // portal1 links to portal2
    // so add portal1 to backward links of portal2
    addBackwardLink: function(portal1, portal2) {
        var backwards = this.backwardLinks;
        var backwardLinks = backwards.get(portal2);
        if (backwardLinks) backwardLinks.add(portal1);
        else {
            backwardLinks = new Set();
            backwardLinks.add(portal1);
            backwards.set(portal2, backwardLinks);
        }
    },

    removePortal: function(portalId, worldMap) {
        portalId = parseInt(portalId);
        var graphics = this.app.engine.graphics;
        var modelPortals = this.portals;
        var worldToPortals = this.worldToPortals;
        var backwardLinks = this.backwardLinks;

        console.log('\n\n');
        console.log('Removing portal ' + portalId + ' ' + typeof portalId);

        var portal = modelPortals.get(portalId);
        if (!portal) {
            console.log('\t... portal ' + portalId + ' not present in model.');
        }

        // Impact model.
        modelPortals.delete(portalId);
        // Recompute map for graphics.
        worldMap.invalidate().computeWorldMap();

        // Impact link model.
        var linked = backwardLinks.get(portalId);
        if (linked) linked.forEach(function(lportal) {
            var backwardsPortal = modelPortals.get(lportal);
            if (!backwardsPortal) { console.log('ERROR: backwards portal not present in model.'); return; }
            graphics.removePartOfPortalObject(backwardsPortal, portal, worldMap);
        });
        if (portal && portal.portalLinkedForward) {
            var portalLinkedForward = modelPortals.get(portal.portalLinkedForward);
            if (portalLinkedForward) {
                backwardLinks.get(portalLinkedForward.portalId).delete(portalId);
            }
        }

        // Impact world-portal model.
        if (portal) {
            var worldId = portal.worldId;
            var worldPortals = worldToPortals.get(worldId);
            worldPortals.delete(portalId);
            if (worldPortals.size < 1) worldToPortals.delete(worldId);
        }

        // Impact portal graphics.
        if (portal) graphics.removePortalObject(portal, worldMap);
    }

});
