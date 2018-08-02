/**
 * Renderer, render layers management.
 */

'use strict';

import * as THREE from 'three';
import extend from '../../../extend.js';

let RendererManager = function(graphicsEngine) {
    this.graphics = graphicsEngine;

    // Cap number of passes.
    this.renderMax = Number.POSITIVE_INFINITY;

    this.renderer = this.createRenderer();

    // Lightweight screen, camera and scene manager for portals.
    this.renderRegister = [];

    this.corrupted = 0;

    this.stop = false;
    this.thenstop = false;
};

extend(RendererManager.prototype, {

    cssToHex(cssColor) {
        return 0 | cssColor.replace('#', '0x');
    },

    createRenderer() {
        // Configure renderer
        let renderer = new THREE.WebGLRenderer({
            // TODO [MEDIUM] propose different antialiasing strategy
            //antialias: true,
            alpha: true
        });

        // renderer.setClearColor(this.cssToHex('#3159ab'), 1);
        renderer.setClearColor(this.cssToHex('#505450'), 1);
        renderer.setSize(window.innerWidth, window.innerHeight);
        return renderer;
    },

    getRenderRegister() {
        return this.renderRegister;
    },

    setRenderRegister(renderRegister) {
        this.renderRegister = renderRegister;
    },

    render(sceneManager, cameraManager) {
        if (this.stop) return;
        let renderer = this.renderer;
        let renderRegister = this.renderRegister;


        // Render first pass.
        let mainScene = sceneManager.mainScene;
        let mainCamera = cameraManager.mainCamera.getRecorder();

        // TODO [CRIT] remove! :0
        this.graphics.updateSunPosition(mainCamera);

        // Render every portal.
        let renderCount = 0;
        let renderMax = this.renderMax;
        mainScene.updateMatrixWorld();

        let currentPass; let screen1; let screen2; let camera;
        let bufferScene; let bufferCamera; let bufferTexture;
        let otherEnd; let otherSceneId;

        for (let j = 0, m = renderRegister.length; j < m; ++j) {
            currentPass = renderRegister[j];
            bufferScene = currentPass.scene;
            if (!bufferScene) continue;
            bufferScene.updateMatrixWorld();
        }

        for (let i = 0, n = renderRegister.length; i < n; ++i) {
            if (renderCount++ > renderMax) break;
            currentPass = renderRegister[i];
            screen1 = currentPass.screen1;
            screen2 = currentPass.screen2;
            camera = currentPass.camera;

            bufferScene = currentPass.scene;
            if (!camera) continue;
            bufferCamera = camera.getRecorder();
            bufferTexture = screen1.getRenderTarget();

            if (!bufferScene)   {
                if (this.corrupted < 5) {
                    console.log(`[Renderer] Could not get buffer scene ${currentPass.sceneId}.`);
                    this.corrupted++;
                }

                // Sometimes the x model would be initialized before the w model.
                if (currentPass.sceneId) { currentPass.scene = sceneManager.getScene(currentPass.sceneId); }
                continue;
            }
            if (!bufferCamera)  { console.log('Could not get buffer camera.'); continue; }
            if (!bufferTexture) { console.log('Could not get buffer texture.'); continue; }

            if (screen2) {
                otherSceneId = currentPass.sceneId;
                otherEnd = screen2.getMesh();
                sceneManager.removeObject(otherEnd, otherSceneId);
            }
            //console.log('[Renderer] Rendering.');
            //screen1.getMesh().updateMatrixWorld();
            //if (screen2) screen2.getMesh().updateMatrixWorld();
            //bufferCamera.updateProjectionMatrix();

            //bufferCamera.updateProjectionMatrix();
            //bufferCamera.updateMatrixWorld();
            //bufferCamera.matrixWorldInverse.getInverse(bufferCamera.matrixWorld);
            this.graphics.cameraManager.moveCameraFromMouse(0, 0, 0, 0);
            //bufferScene.updateMatrixWorld();
            renderer.render(bufferScene, bufferCamera, bufferTexture);

            //if (true) {
                //let rec = cameraManager.mainCamera.getRecorder(); //.getRecorder();
                //rec.updateProjectionMatrix();
                //rec.updateMatrixWorld();
                //rec.matrixWorldInverse.getInverse(rec.matrixWorld);
            //}

            //if (this.thenstop) {
                //let posX = screen1.getMesh().position;
                //let  = localRecorder.position;
                //let posC = new THREE.Vector3();
                //posC.setFromMatrixPosition(mainCamera.matrixWorld);

                //let me = this.graphics.app.model.server.selfModel.position;

                //console.log('#####\nCAM POSITION');
                //console.log(posC);
                //console.log(cameraManager.mainCamera.get3DObject().position);
                //console.log('X POSITION');
                //console.log(posX);
                //console.log('ME POSITION');
                //console.log(me);
            //}

            if (screen2) {
                sceneManager.addObject(otherEnd, otherSceneId);
                //otherEnd.updateMatrixWorld();
            }
        }

        //console.log(renderCount);

        mainCamera.updateProjectionMatrix();
        mainCamera.updateMatrixWorld();
        mainCamera.matrixWorldInverse.getInverse(mainCamera.matrixWorld);
        //this.graphics.cameraManager.moveCameraFromMouse(0, 0, 0, 0);
        //mainScene.updateMatrixWorld();
        renderer.render(mainScene, mainCamera);


        //if (this.thenstop) {
            //this.stop = true;
        //}
    },

    resize(width, height) {
        if (!width) width = window.innerWidth;
        if (!height) height = window.innerHeight;
        this.renderer.setSize(width, height);
    },

    switchAvatarToScene(/*sceneId*/) {
        // TODO [CRIT] update render register.
        // this.renderRegister;
    }

});

/** Interface with graphics engine. **/

let RenderersModule = {

    createRendererManager() {
        return new RendererManager(this);
    }

};

export { RenderersModule };
