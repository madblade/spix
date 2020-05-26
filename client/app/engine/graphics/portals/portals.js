/**
 * Portal management functions.
 */

'use strict';

import { Screen } from './screen.js';
import {
    DoubleSide, LinearFilter, NearestFilter, RGBFormat,
    Mesh, PlaneBufferGeometry, ShaderMaterial, WebGLRenderTarget
} from 'three';

let PortalsModule = {

    addStubPortalObject(portal) {
        let worldId = portal.worldId; // World this portal stands in.
        let portalId = portal.portalId;
        //console.log('Adding stub: p(' + portalId + '), w(' + worldId + ')');

        // Get scene.
        let scene = this.getScene(worldId, true);
        // Force scene manager to create a scene.

        if (!scene) { // Still possible.
            console.log(`Could not load scene from ${worldId} (${typeof worldId}).`);
            return;
        }

        // Create screen.
        let screen = this.getScreen(portalId);
        if (!screen) {
            console.log('NNNNNNNEEEEEEW SCREEEEEENu');
            let pos = portal.tempPosition;
            let top = portal.tempOtherPosition;
            // let tempOffset = portal.tempOffset;
            let tempOrientation = portal.tempOrientation;
            let portalWidth = portal.tempWidth;
            let portalHeight = portal.tempHeight;

            let width = window.innerWidth; // (portalWidth * window.innerWidth) / 2;
            let height = window.innerHeight; // (portalHeight * window.innerHeight) / 2;
            let rtTexture = new WebGLRenderTarget(
                width, height,
                {
                    minFilter: LinearFilter,
                    magFilter: NearestFilter,
                    format: RGBFormat
                }
            );

            // TODO call new geometry from meshes module
            let geometry = new PlaneBufferGeometry(portalWidth, portalHeight);

            let portalVShader = this.getPortalVertexShader();
            let portalFShader = this.getPortalFragmentShader();
            let material = new ShaderMaterial({
                side: DoubleSide,
                uniforms: {
                    texture1: { type: 't', value: rtTexture.texture }
                },
                vertexShader: portalVShader,
                fragmentShader: portalFShader
            });
            let mesh = new Mesh(geometry, material);

            let x0 = Math.floor(pos[0]);
            let y0 = Math.floor(pos[1]);
            let z0 = Math.floor(pos[2]);

            let x1 = Math.floor(top[0]);
            let y1 = Math.floor(top[1]);
            let z1 = Math.floor(top[2]);

            let PI2 = Math.PI / 2;
            if (z0 !== z1) {
                mesh.rotation.x = PI2;
                mesh.rotation.y = PI2 + parseFloat(tempOrientation);
                mesh.position.x = pos[0] + 0.5;
                mesh.position.y = pos[1] + 0.5;
                mesh.position.z = pos[2] + 1;
            } else if (y0 !== y1) {
                mesh.rotation.y = PI2 - parseFloat(tempOrientation);
                mesh.position.x = pos[0] + 0.5;
                mesh.position.y = pos[1] + 1;
                mesh.position.z = pos[2] + 0.5;
            } else if (x0 !== x1) {
                mesh.rotation.z = PI2;
                mesh.position.x = pos[0] + 1;
                mesh.position.y = pos[1] + 0.5;
                mesh.position.z = pos[2] + 0.5;
                mesh.rotation.x = PI2 + parseFloat(tempOrientation);
            }

            // mesh.updateMatrixWorld();
            screen = new Screen(portalId, mesh, rtTexture, worldId);
            this.addScreen(portalId, screen);
        }

        if (screen) {
            this.addToScene(screen.getMesh(), worldId);
        }
    },

    // portal linked forward to otherPortal
    completeStubPortalObject(portal, otherPortal, cameraPath, cameraTransform) {
        let worldId = portal.worldId;
        let portalId = portal.portalId;
        // let otherEndId = worldId;
        // if (otherPortal) {
        //     otherEndId = otherPortal.worldId;
        // }

        // Affect linked portal.
        portal.portalLinkedForward = otherPortal.portalId;
        //console.log('Completing stub: p(' + portalId + '),
        // w(' + worldId + '), f(' + otherPortal.portalId + ')');

        // Create and configure renderer, camera.
        let screen = this.getScreen(portalId);
        if (!screen) {
            console.log(`Could not get screen to complete: ${portalId}.`);
            return;
        }

        // TODO [CRIT] add several times with different paths.
        // TODO [CRIT] compute all paths.
        // TODO [CRIT] DON'T ACCOUNT for portals that are too far away!
        // TODO [CRIT] that's how many camera paths I'll have to add until the leaves.
        this.cameraManager.addCamera(portal, otherPortal, cameraPath, cameraTransform, screen);
        this.cameraManager.addCameraToScene(cameraPath, worldId, screen);
    },

    processPortalUpdates() {
        //console.log('[X] Processing portal graphical updates.');
        let portalUpdates = this.portalUpdates;
        if (portalUpdates.length < 1) return;
        let u;
        let hasAddedSomething = false;

        // TODO [ALG] Add portal I just crossed first (closest to destinationWid).
        let addedFirst = [];
        for (let i = 0; i < portalUpdates.length; ++i) {
            u = portalUpdates[i];
            console.log(`${u.destinationWid}, ${u.portal.worldId}, ${this.previousFrameWorld}`);

            let dwid = parseInt(u.destinationWid, 10);
            let owid = parseInt(u.portal.worldId, 10);
            let pwid = parseInt(this.previousFrameWorld, 10);
            let cwid = parseInt(this.currentFrameWorld, 10);

            if (dwid === pwid || dwid === cwid || owid === pwid || owid === cwid) {
                //console.log('Added ' + this.previousFrameWorld + ', '
                // + u.destinationWid);
                this.addPortalGraphics(u.portal, u.otherPortal,
                    u.cameraPath, u.cameraTransform, u.depth,
                    u.originPid, u.destinationPid, u.destinationWid,
                    u.pidPathString);
                addedFirst.push(i);
                hasAddedSomething = true;
            }
        }
        for (let j = addedFirst.length - 1; j >= 0; --j) {
            portalUpdates.splice(addedFirst[j], 1);
        }

        if (!hasAddedSomething) {
            u = portalUpdates.shift();
            this.addPortalGraphics(u.portal, u.otherPortal,
                u.cameraPath, u.cameraTransform, u.depth,
                u.originPid, u.destinationPid, u.destinationWid,
                u.pidPathString);
        }
    },

    flushPortalUpdates() {
        this.portalUpdates = [];
    },

    unflushPortalUpdates() {
        let portalUpdates = this.portalUpdates;
        let lastRenderPaths = this.lastRenderPaths;
        let lastRenderGates = this.lastRenderGates;

        // Remove only screens and cameras that need to be.
        let cameraManager = this.cameraManager;
        let sceneManager = this.sceneManager;

        let rp = new Set();
        let rg = new Set();

        for (let i = 0, l = portalUpdates.length; i < l; ++i) {
            let currentUpdate = portalUpdates[i];
            rp.add(currentUpdate.pidPathString);
            rg.add(currentUpdate.originPid);
        }
        lastRenderPaths.forEach(function(path) {
            if (!rp.has(path)) cameraManager.removeCameraFromScene(path);
        });
        lastRenderGates.forEach(function(gate) {
            if (!rg.has(gate)) sceneManager.removeScreen(gate);
        });

        // Flush render targets.
        this.rendererManager.setRenderRegister([]);
        this.lastRenderPaths = new Set();
        this.lastRenderGates = new Set();
    },

    addPortalGraphics(portal, otherPortal, cameraPath, cameraTransform,
        depth, originPid, destinationPid, destinationWid, pidPathString)
    {
        let renderRegister = this.rendererManager.getRenderRegister();
        for (let i in renderRegister)
            if (renderRegister.hasOwnProperty(i) &&
                renderRegister[i].id === pidPathString)
                return; // already added.

        this.addStubPortalObject(portal);
        this.completeStubPortalObject(portal, otherPortal, cameraPath, cameraTransform);

        let screens = this.sceneManager.screens;
        let cameras = this.cameraManager.subCameras;
        let scenes = this.sceneManager.subScenes;

        // For each camera, remember its path.
        // When rendering is performed,
        // Every camera shall have to render from its transformed state back to the root.
        // So reorder rendering phase according to camera depths.
        renderRegister.push({
            id: pidPathString,

            /*depth: */depth,
            screen1: screens.get(originPid),
            screen2: screens.get(destinationPid),
            sceneId: destinationWid,
            scene: scenes.get(destinationWid),
            camera: cameras.get(pidPathString)
        });

        this.lastRenderPaths.add(pidPathString);
        this.lastRenderGates.add(originPid);

        // Sort in reverse order! (high depth to low depth).
        renderRegister.sort(function(a, b) { return a.depth < b.depth; });

        // Update renderer.
        this.rendererManager.setRenderRegister(renderRegister);
    },

    addPortalObject(portal, otherPortal, cameraPath, cameraTransform,
        depth, originPid, destinationPid, destinationWid,
        pidPathString)
    {
        this.portalUpdates.push({
            /*portal: */portal,
            /*otherPortal: */otherPortal,
            /*cameraPath: */cameraPath,
            /*cameraTransform: */cameraTransform,

            /*depth: */depth,
            /*originPid: */originPid,
            /*destinationPid: */destinationPid,
            /*destinationWid: */destinationWid,
            /*pidPathString: */pidPathString
        });
    },

    // Remove link between portal (which is still present) and otherPortal
    // which is to be removed. Portal used to lead to otherPortal.
    removePartOfPortalObject(portal, otherPortal/*, worldMap*/)
    {
        // let worldId = portal.worldId;

        //console.log('Removing stub: p(' + portal.portalId + ') -> o(' + otherPortal.portalId + ')');

        // Remove screen and subCameras.
        let currentPortalId = portal.portalId;
        let otherPortalId = otherPortal.portalId;
        let screenToBeRemoved = this.getScreen(otherPortalId);
        let screenToBeAltered = this.getScreen(currentPortalId);

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
    removePortalObject(portal/*, worldMap*/)
    {
        // let worldId = portal.worldId;

        let currentPortalId = portal.portalId;

        console.log(`Removing full portal: p(${portal.portalId})`);
        // TODO [CRIT] search in depth and remove every portal in the chain.

        // 1 screen <-> 1 portal
        let screenToBeRemoved = this.getScreen(currentPortalId);

        this.removeScreen(screenToBeRemoved.screenId);
    }

};

export { PortalsModule };
