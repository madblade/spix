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

        var width = window.innerWidth; // (tempWidth * window.innerWidth) / 2;
        var height = window.innerHeight; // (tempHeight * window.innerHeight) / 2;
        var rtTexture = new THREE.WebGLRenderTarget(
            width, height,
            { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBFormat }
        );

        var geometry = new THREE.PlaneBufferGeometry(tempWidth, tempHeight);
        // geometry.addAttribute('uv', new THREE.BufferAttribute(uvs, 2));
        var uvs = geometry.attributes.uv.array;
        var uvi = 0;
        // Quad 1
        uvs[uvi++] = 1.0; uvs[uvi++] = 1.0; // 1, 1 -> top right
        uvs[uvi++] = 0.;  uvs[uvi++] = 1.0; // 0, 1 -> top left
        uvs[uvi++] = 1.0; uvs[uvi++] = 0.;  // 1, 0 -> bottom right
        uvs[uvi++] = 0.;  uvs[uvi++] = 0.;  // 0, 0 -> bottom left

        var portalVShader = this.getPortalVertexShader();
        var portalFShader = this.getPortalFragmentShader();
        var material = new THREE.ShaderMaterial({
            side: THREE.FrontSide,
            uniforms: {
                texture1: { type:'t', value:rtTexture.texture }
            },
            vertexShader: portalVShader,
            fragmentShader: portalFShader
        });
        var mesh = new THREE.Mesh(geometry, material);

        // TODO [CRIT] render target position, rotation.
        mesh.position.x = tempPosition[0] + 0.5;
        mesh.position.y = tempPosition[1];
        mesh.position.z = tempPosition[2] + 1;
        mesh.rotation.x = Math.PI/2;

        screen = [mesh, rtTexture];
        this.addScreen(portalId, screen);
    }

    if (screen) {
        this.addToScene(screen[0], worldId);
    }
};

App.Engine.Graphics.prototype.completeStubPortalObject = function(portal, otherPortal) {
    var worldId = portal.worldId;
    var portalId = portal.portalId;

    // Affect linked portal.
    portal.portalLinkedForward = otherPortal.portalId;
    console.log('Completing stub: p(' + portalId + '), w(' + worldId + '), f(' + otherPortal.portalId + ')');

    // Create and configure renderer, camera.
    var screen = this.getScreen(portalId);
    if (!screen || screen.length !== 2) {
        console.log('A completed stub cannot be completed again: ' + portalId);
        return;
    }
    var aspect = portal.tempWidth/portal.tempHeight;
    var p1 = otherPortal.tempPosition;
    this.cameraManager.addCamera(portalId, aspect, p1);

    // Link scene.
    var otherWorldId = otherPortal.worldId;
    screen.push(otherWorldId); // Important.
    this.cameraManager.addWrapperToScene(portalId, worldId);
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

