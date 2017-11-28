/**
 * Renderer, render layers management.
 */

'use strict';

import * as THREE from 'three';
import extend from '../../../extend.js';

var RendererManager = function(graphicsEngine) {
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

    createRenderer: function() {
        // Configure renderer
        var renderer = new THREE.WebGLRenderer({
            // TODO [MEDIUM] propose different antialiasing strategy
            //antialias: true,
            alpha: true
        });

        renderer.setClearColor(0x435D74, 1);
        renderer.setSize(window.innerWidth, window.innerHeight);
        return renderer;
    },

    getRenderRegister: function() {
        return this.renderRegister;
    },

    setRenderRegister: function(renderRegister) {
        this.renderRegister = renderRegister;
    },

    render: function(sceneManager, cameraManager) {
        if (this.stop) return;
        var renderer = this.renderer;
        var renderRegister = this.renderRegister;

        // Render first pass.
        var mainScene = sceneManager.mainScene;
        var mainCamera = cameraManager.mainCamera.getRecorder();

        // Render every portal.
        var renderCount = 0;
        var renderMax = this.renderMax;
        mainScene.updateMatrixWorld();

        var currentPass; var screen1; var screen2; var camera;
        var bufferScene; var bufferCamera; var bufferTexture;
        var otherEnd; var otherSceneId;

        for (var j = 0, m = renderRegister.length; j < m; ++j) {
            currentPass = renderRegister[j];
            bufferScene = currentPass.scene;
            if (!bufferScene) continue;
            bufferScene.updateMatrixWorld();
        }

        for (var i = 0, n = renderRegister.length; i < n; ++i) {
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
                    console.log('[Renderer] Could not get buffer scene ' + currentPass.sceneId + '.');
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
                //var rec = cameraManager.mainCamera.getRecorder(); //.getRecorder();
                //rec.updateProjectionMatrix();
                //rec.updateMatrixWorld();
                //rec.matrixWorldInverse.getInverse(rec.matrixWorld);
            //}

            //if (this.thenstop) {
                //var posX = screen1.getMesh().position;
                //var  = localRecorder.position;
                //var posC = new THREE.Vector3();
                //posC.setFromMatrixPosition(mainCamera.matrixWorld);

                //var me = this.graphics.app.model.server.selfModel.position;

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

    resize: function(width, height) {
        if (!width) width = window.innerWidth;
        if (!height) height = window.innerHeight;
        this.renderer.setSize(width, height);
    },

    switchAvatarToScene: function(/*sceneId*/) {
        // TODO [CRIT] update render register.
        this.renderRegister;
    }

});

/** Interface with graphics engine. **/

var RenderersModule = {

    createRendererManager: function() {
        return new RendererManager(this);
    }

};

export { RenderersModule };
