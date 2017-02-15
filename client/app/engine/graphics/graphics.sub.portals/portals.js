/**
 * Portal management functions.
 */

'use strict';

extend(App.Engine.Graphics.prototype, {

    addStubPortalObject: function(portal) {
        var worldId = portal.worldId; // World this portal stands in.
        var portalId = portal.portalId;
        //console.log('Adding stub: p(' + portalId + '), w(' + worldId + ')');

        // Get scene.
        var scene = this.getScene(worldId, true); // Force scene manager to create a scene.
        if (!scene) { // Still possible.
            console.log('Could not load scene from ' + worldId + ' (' + (typeof worldId) + ')');
            return;
        }

        // Create screen.
        var screen = this.getScreen(portalId);
        if (!screen) {
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
            //var uvs = geometry.attributes.uv.array;
            //var uvi = 0;
            // Quad 1
            //uvs[uvi++] = 1.0; uvs[uvi++] = 1.0; // 1, 1 -> top right
            //uvs[uvi++] = 0.;  uvs[uvi++] = 1.0; // 0, 1 -> top left
            //uvs[uvi++] = 1.0; uvs[uvi++] = 0.;  // 1, 0 -> bottom right
            //uvs[uvi++] = 0.;  uvs[uvi++] = 0.;  // 0, 0 -> bottom left

            var portalVShader = this.getPortalVertexShader();
            var portalFShader = this.getPortalFragmentShader();
            var material = new THREE.ShaderMaterial({
                side: THREE.DoubleSide,
                uniforms: {
                    texture1: { type:'t', value:rtTexture.texture }
                },
                vertexShader: portalVShader,
                fragmentShader: portalFShader
            });
            var mesh = new THREE.Mesh(geometry, material);

            mesh.position.x = tempPosition[0] + 0.999;
            mesh.position.y = tempPosition[1] + 0.5;
            mesh.position.z = tempPosition[2] + 1;
            mesh.rotation.x = Math.PI/2;
            mesh.rotation.y = Math.PI/2;

            screen = new App.Engine.Graphics.Screen(portalId, mesh, rtTexture, worldId);
            this.addScreen(portalId, screen);
        }

        if (screen) {
            this.addToScene(screen.getMesh(), worldId);
        }
    },

    // portal linked forward to otherPortal
    completeStubPortalObject: function(portal, otherPortal, cameraPath, cameraTransform) {
        var worldId = portal.worldId;
        var portalId = portal.portalId;

        // Affect linked portal.
        portal.portalLinkedForward = otherPortal.portalId;
        //console.log('Completing stub: p(' + portalId + '), w(' + worldId + '), f(' + otherPortal.portalId + ')');

        // Create and configure renderer, camera.
        var screen = this.getScreen(portalId);
        if (!screen) {
            console.log('Could not get screen to complete: ' + portalId);
            return;
        }

        // TODO [CRIT] add several times with different paths.
        // TODO [CRIT] compute all paths.
        // TODO [CRIT] DON'T ACCOUNT for portals that are too far away!
        // TODO [CRIT] that's how many camera paths I'll have to add until the leaves.
        this.cameraManager.addCamera(portal, otherPortal, cameraPath, cameraTransform);
        this.cameraManager.addCameraToScene(cameraPath, worldId);
    },

    addPortalObject: function(portal, otherPortal, cameraPath, cameraTransform) {
        this.addStubPortalObject(portal);
        this.completeStubPortalObject(portal, otherPortal, cameraPath, cameraTransform);
    },

    // Remove link between portal (which is still present) and otherPortal
    // which is to be removed. Portal used to lead to otherPortal.
    removePartOfPortalObject: function(portal, otherPortal, worldMap) {
        var worldId = portal.worldId;

        //console.log('Removing stub: p(' + portal.portalId + ') -> o(' + otherPortal.portalId + ')');

        // Remove screen and subCameras.
        var currentPortalId = portal.portalId;
        var otherPortalId = otherPortal.portalId;
        var screenToBeRemoved = this.getScreen(otherPortalId);
        var screenToBeAltered = this.getScreen(currentPortalId);

        // 1 portal <=> 1 screen
        // But beware! 1 portal <=> multiple cameras.
        // Camera paths are necessary for handling redundancy in portal
        // chains.

        // TODO [CRIT] a camera must know its full render path.
        // TODO [CRIT] search in depth and remove every portal in the chain.
        // TODO [CRIT] remove screen otherWorldId
        // TODO [CRIT] remove in-depth subCameras.
        // TODO [CRIT] remove backwards variable

        if (!screenToBeAltered) { console.log('WARN @portals.js: screen to be altered not found.'); }
        else {
            screenToBeAltered.setOtherWorldId(null);
            // Tweak to prevent weird stuff when a portal camera has been unloaded but
            // the rendered texture is still displaying the last rendered frame.
            screenToBeAltered.getRenderTarget().setSize(0, 0);
        }

        if (!screenToBeRemoved) { console.log('WARN @portals.js: screen to be removed not found.'); }
        else {
            //this.removeScreen(screenToBeRemoved.screenId);
        }

    },

    // Remove the aforementioned portal.
    removePortalObject: function(portal, worldMap) {
        var worldId = portal.worldId;

        var currentPortalId = portal.portalId;

        console.log('Removing full portal: p(' + portal.portalId + ')');
        // TODO [CRIT] search in depth and remove every portal in the chain.

        // 1 screen <-> 1 portal
        var screenToBeRemoved = this.getScreen(currentPortalId);

        this.removeScreen(screenToBeRemoved.screenId);
    }

});
