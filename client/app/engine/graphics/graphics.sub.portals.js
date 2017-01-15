/**
 *
 */

'use strict';

App.Engine.Graphics.prototype.addStubPortalObject = function(portal) {
    var worldId = portal.worldId; // World this portal stands in.
    var portalId = portal.portalId;
    console.log('Adding stub: p(' + portalId + '), w(' + worldId + ')');

    // Get scene.
    var scene = this.getScene(worldId);
    if (!scene) {
        console.log('Could not load scene from ' + worldId + ' (' + (typeof worldId) + ')');
        return;
    }

    // Create screen.
    var screen = this.getScreen(portalId);
    if (!screen) {
        // TODO [CRIT] render target dimensions.
        var tempPosition = portal.tempPosition;
        var tempWidth = portal.tempWidth;
        var tempHeight = portal.tempHeight;

        var width = (tempWidth * window.innerWidth) / 2;
        var height = (tempHeight * window.innerHeight) / 2;
        var rtTexture = new THREE.WebGLRenderTarget(
            width, height,
            { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBFormat }
        );

        var geometry = new THREE.PlaneBufferGeometry(tempWidth, tempHeight);
        var material = new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, color: 0xffffff, map: rtTexture.texture } );
        var mesh = new THREE.Mesh(geometry, material);

        // TODO [CRIT] render target position, rotation.
        mesh.position.x = tempPosition[0] + 0.5;
        mesh.position.y = tempPosition[1];
        mesh.position.z = tempPosition[2] + 1;
        mesh.rotation.x = Math.PI/2;

        screen = [mesh, rtTexture];
        this.addScreen(portalId, screen);
    }

    if (screen) this.addToScene(screen[0], worldId);
};

App.Engine.Graphics.prototype.completeStubPortalObject = function(portal, otherPortal) {
    var worldId = portal.worldId;
    var portalId = portal.portalId;

    // Affect linked portal.
    portal.portalLinkedForward = otherPortal.portalId;
    console.log('Completing stub: p(' + portalId + '), w(' + worldId + '), f(' + otherPortal.portalId + ')');

    // Create and configure renderer, camera.
    var screen = this.getScreen(portalId);
    if (screen.length !== 2) {
        console.log('A completed stub cannot be completed again: ' + portalId);
        return;
    }
    this.cameraManager.addCamera(portalId);

    // Link scene.
    var otherWorldId = otherPortal.worldId;
    screen.push(otherWorldId); // Important.
    var scene = this.getScene(otherWorldId);
};

App.Engine.Graphics.prototype.addPortalObject = function(portal, otherPortal) {
    var worldId = portal.worldId;

    this.addStubPortalObject(portal);
    this.completeStubPortalObject(portal, otherPortal);
};

App.Engine.Graphics.prototype.removePartOfPortalObject = function(portal, otherPortal) {
    var worldId = portal.worldId;

};

App.Engine.Graphics.prototype.removePortalObject = function(portal) {
    var worldId = portal.worldId;

};

