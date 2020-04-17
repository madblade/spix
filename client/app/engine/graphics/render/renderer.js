/**
 * Renderer, render layers management.
 */

'use strict';

import extend from '../../../extend.js';
import { WebGLRenderer } from 'three';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';

let RendererManager = function(graphicsEngine) {
    this.graphics = graphicsEngine;

    // Cap number of passes.
    this.renderMax = Number.POSITIVE_INFINITY;

    this.renderer = this.createRenderer();
    this.composers = new Map();

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

    createComposer(rendrr, sc, cam, target) {
        let resolutionX = 1 / window.innerWidth;
        let resolutionY = 1 / window.innerHeight;
        let fxaa = new ShaderPass(FXAAShader);
        let u = 'resolution';
        fxaa.uniforms[u].value.set(resolutionX, resolutionY);
        let composer = !target ? new EffectComposer(rendrr) : new EffectComposer(rendrr, target);
        let scenePass = new RenderPass(sc, cam);
        composer.addPass(scenePass);
        composer.addPass(fxaa);
        return composer;
    },

    createRenderer() {
        // Configure renderer
        let renderer = new WebGLRenderer({
            // TODO [MEDIUM] propose different antialiasing strategy
            antialias: false,
            alpha: true
        });

        renderer.setClearColor(this.cssToHex('#362c6b'), 1);
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

        // TODO [CRIT] do this for every portal with a different camera transform path.
        let skies = this.graphics.app.model.server.chunkModel.skies;
        skies.forEach(sky => {
            this.graphics.updateSunPosition(mainCamera, sky);
        });

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
                sceneManager.removeObject(otherEnd, otherSceneId, true);
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

            // renderer.setRenderTarget(bufferTexture);
            let id = currentPass.id.toString();
            let composer;
            if (this.composers.has(id)) {
                composer = this.composers.get(id);
            } else {
                composer = this.createComposer(renderer, bufferScene, bufferCamera, bufferTexture);
                this.composers.set(id, composer);
            }
            composer.render(); // Double render for camera 1frame lag.
            composer.render();
            // renderer.render(bufferScene, bufferCamera);
            // renderer.setRenderTarget(null);

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
        let id = this.graphics.app.model.server.selfModel.worldId.toString();
        let composer;
        if (this.composers.has(id)) {
            composer = this.composers.get(id);
        } else {
            composer = this.createComposer(renderer, mainScene, mainCamera, null);
            this.composers.set(id, composer);
        }
        composer.render();
        // renderer.render(mainScene, mainCamera);


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
        // TODO here goes the mesh switch.
        // this.renderRegister;
    },

    cleanup() {
        this.renderRegister.length = 0;
    }

});

/** Interface with graphics engine. **/

let RenderersModule = {

    createRendererManager() {
        return new RendererManager(this);
    }

};

export { RenderersModule };
