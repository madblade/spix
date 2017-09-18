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
            var pos = portal.tempPosition;
            var top = portal.tempOtherPosition;
            var tempOffset = portal.tempOffset;
            var tempOrientation = portal.tempOrientation;
            var portalWidth = portal.tempWidth;
            var portalHeight = portal.tempHeight;

            var width = window.innerWidth; // (tempWidth * window.innerWidth) / 2;
            var height = window.innerHeight; // (tempHeight * window.innerHeight) / 2;
            var rtTexture = new THREE.WebGLRenderTarget(
                width, height,
                { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBFormat }
            );

            var geometry = new THREE.PlaneBufferGeometry(portalWidth, portalHeight);
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

            // TODO [CRIT] orientations
            // console.log(tempOffset);
            var x0 = parseInt(pos[0]), y0 = parseInt(pos[1]), z0 = parseInt(pos[2]);
            var x1 = parseInt(top[0]), y1 = parseInt(top[1]), z1 = parseInt(top[2]);
            
            if (z0 !== z1) {
                if (tempOrientation === 'first') {
                    mesh.rotation.x = Math.PI/2;
                    mesh.rotation.y = Math.PI/2;
                    mesh.position.x = pos[0] + parseFloat(tempOffset);
                    mesh.position.y = pos[1] + 0.5;
                    mesh.position.z = pos[2] + 1;
                } else if (tempOrientation === 'next') {
                    mesh.rotation.x = Math.PI/2;
                    mesh.rotation.y = Math.PI/2;
                    mesh.position.x = pos[0] + 0.5;
                    mesh.position.y = pos[1] + parseFloat(tempOffset);
                    mesh.position.z = pos[2] + 1;
                    mesh.rotation.y += Math.PI/2;
                }
            } else if (y0 !== y1) {
                if (tempOrientation === 'first') {
                    mesh.rotation.x = Math.PI/2;
                    mesh.rotation.y = Math.PI/2;
                    mesh.rotation.z = Math.PI/2;
                    mesh.position.x = pos[0] + parseFloat(tempOffset);
                    mesh.position.y = pos[1] + 1;
                    mesh.position.z = pos[2] + 0.5;
                } else if (tempOrientation === 'next') {
                    mesh.position.x = pos[0] + 0.5;
                    mesh.position.y = pos[1] + 1;
                    mesh.position.z = pos[2] + parseFloat(tempOffset);
                }
            } else if (x0 !== x1) {
                mesh.rotation.z = Math.PI/2;
                if (tempOrientation === 'first') {
                    mesh.position.x = pos[0] + 1;
                    mesh.position.y = pos[1] + 0.5;
                    mesh.position.z = pos[2] + parseFloat(tempOffset);
                } else if (tempOrientation === 'next') {
                    mesh.position.x = pos[0] + 1;
                    mesh.position.y = pos[1] + parseFloat(tempOffset);
                    mesh.position.z = pos[2] + 0.5;
                    mesh.rotation.x += Math.PI/2;
                }
            }

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

    processPortalUpdates: function() {
        var portalUpdates = this.portalUpdates;
        if (portalUpdates.length < 1) return;
        var u = portalUpdates.shift();
        this.addPortalGraphics(u.portal, u.otherPortal, u.cameraPath, u.cameraTransform,
            u.depth, u.originPid, u.destinationPid, u.destinationWid, u.pidPathString);
    },
    
    flushPortalUpdates: function() {
        this.portalUpdates = [];
    },
    
    unflushPortalUpdates: function() {
        var portalUpdates = this.portalUpdates;
        var lastRenderPaths = this.lastRenderPaths;
        var lastRenderGates = this.lastRenderGates;
        
        // Remove only screens and cameras that need to be.
        var cameraManager = this.cameraManager;
        var sceneManager = this.sceneManager;
        
        var rp = new Set(), rg = new Set();
        for (var i = 0, l = portalUpdates.length; i < l; ++i) {
            var currentUpdate = portalUpdates[i];
            rp.add(currentUpdate.pidPathString);
            rg.add(currentUpdate.originPid);
        }
        lastRenderPaths.forEach(function(path) { if (!rp.has(path)) cameraManager.removeCameraFromScene(path) });
        lastRenderGates.forEach(function(gate) { if (!rg.has(gate)) sceneManager.removeScreen(gate); });
        
        // Flush render targets.
        // TODO [HIGH] graphics: adaptive render register (prevent texture freezing) 
        this.rendererManager.setRenderRegister([]);
        this.lastRenderPaths = new Set();
        this.lastRenderGates = new Set();
    },
    
    addPortalGraphics: function(portal, otherPortal, cameraPath, cameraTransform,
                                depth, originPid, destinationPid, destinationWid, pidPathString) 
    {
        var renderRegister = this.rendererManager.getRenderRegister();
        for (var i in renderRegister) if (renderRegister.hasOwnProperty(i) && renderRegister[i].id === pidPathString)
            return; // already added.
        
        this.addStubPortalObject(portal);
        this.completeStubPortalObject(portal, otherPortal, cameraPath, cameraTransform);
        
        var screens = this.sceneManager.screens;
        var cameras = this.cameraManager.subCameras;
        var scenes = this.sceneManager.subScenes;

        // For each camera, remember its path.
        // When rendering is performed,
        // Every camera shall have to render from its transformed state back to the root.
        // So reorder rendering phase according to camera depths.
        renderRegister.push({
            id: pidPathString,
            
            depth: depth,
            screen1: screens.get(originPid),
            screen2: screens.get(destinationPid),
            sceneId: destinationWid,
            scene: scenes.get(destinationWid),
            camera: cameras.get(pidPathString)
        });

        this.lastRenderPaths.add(pidPathString);
        this.lastRenderGates.add(originPid);
        
        // Sort in reverse order! (high depth to low depth).
        renderRegister.sort(function(a, b) { return a.depth < b.depth });

        // Update renderer.
        this.rendererManager.setRenderRegister(renderRegister);
    },
    
    addPortalObject: function(portal, otherPortal, cameraPath, cameraTransform,
                              depth, originPid, destinationPid, destinationWid, pidPathString) 
    {
        this.portalUpdates.push({
            portal: portal,
            otherPortal: otherPortal,
            cameraPath: cameraPath,
            cameraTransform: cameraTransform,
            
            depth: depth,
            originPid: originPid,
            destinationPid: destinationPid,
            destinationWid: destinationWid,
            pidPathString: pidPathString
        });
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
