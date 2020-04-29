/**
 * Renderer, render layers management.
 */

'use strict';

import extend from '../../../extend.js';
import {
    Layers, PCFSoftShadowMap,
    DoubleSide, sRGBEncoding,
    Vector2,
    MeshBasicMaterial, ShaderMaterial,
    WebGLRenderer
} from 'three';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { SAOPass } from 'three/examples/jsm/postprocessing/SAOPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

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

    // Bloom
    this.darkMaterial = new MeshBasicMaterial({ color: 'black', side: DoubleSide });
};

extend(RendererManager.prototype, {

    cssToHex(cssColor) {
        return 0 | cssColor.replace('#', '0x');
    },

    createComposer(rendrr, sc, cam, target)
    {
        let composer = !target ? new EffectComposer(rendrr) : new EffectComposer(rendrr, target);
        let scenePass = new RenderPass(sc, cam);
        composer.addPass(scenePass);

        // Anti-alias
        let resolutionX = 1 / window.innerWidth;
        let resolutionY = 1 / window.innerHeight;
        let fxaa = new ShaderPass(FXAAShader);
        let u = 'resolution';
        fxaa.uniforms[u].value.set(resolutionX, resolutionY);
        composer.addPass(fxaa);
        composer.addPass(fxaa);

        // Bloom
        let bloomPass = new UnrealBloomPass(
            new Vector2(window.innerWidth, window.innerHeight),
            1.5, 0.4, 0.85);
        bloomPass.exposure = 0.5;
        bloomPass.threshold = 0.3;
        bloomPass.strength = 1.0;
        bloomPass.radius = 0;
        let bloomComposer = !target ?
            new EffectComposer(rendrr) : new EffectComposer(rendrr, target);
        bloomComposer.renderToScreen = false;
        bloomComposer.addPass(scenePass);
        bloomComposer.addPass(bloomPass); // no fxaa on the bloom pass

        let bloomMergePass = new ShaderPass(
            new ShaderMaterial({
                uniforms: {
                    baseTexture: { value: null },
                    bloomTexture: { value: bloomComposer.renderTarget2.texture }
                },
                vertexShader: this.graphics.getBloomSelectiveVertexShader(),
                fragmentShader: this.graphics.getBloomSelectiveFragmentShader(),
                defines: {}
            }), 'baseTexture'
        );
        bloomMergePass.needsSwap = true;
        let finalComposer = !target ?
            new EffectComposer(rendrr) : new EffectComposer(rendrr, target);
        finalComposer.addPass(scenePass);
        finalComposer.addPass(bloomMergePass);
        finalComposer.addPass(fxaa);

        // Ambient occlusion
        let ultraGraphics = false;
        if (!target && ultraGraphics) {
            let sao = new SAOPass(sc, cam, false, false);
            sao.params.output = SAOPass.OUTPUT.Default;
            sao.params.saoBias = 0.1;
            sao.params.saoIntensity = 0.18;
            sao.params.saoScale = 10000;
            sao.params.saoKernelRadius = 100;
            sao.params.saoMinResolution = 0.000004;
            sao.params.saoBlur = 1;
            sao.params.saoBlurRadius = 8;
            sao.params.saoBlurStdDev = 4;
            sao.params.saoBlurDepthCutoff = 0.01;
            finalComposer.addPass(sao);
        }

        return [bloomComposer, finalComposer, composer];
    },

    createRenderer() {
        // Configure renderer
        let renderer = new WebGLRenderer({
            // TODO [MEDIUM] propose different antialiasing strategy
            antialias: false,
            alpha: true,
            // precision: 'mediump'
        });

        // renderer.shadowMap.enabled = true;
        // renderer.shadowMap.type = PCFSoftShadowMap;

        renderer.outputEncoding = sRGBEncoding;
        renderer.setClearColor(this.cssToHex('#362c6b'), 1);
        renderer.setSize(window.innerWidth, window.innerHeight);

        renderer.info.autoReset = false;
        return renderer;
    },

    getRenderRegister() {
        return this.renderRegister;
    },

    setRenderRegister(renderRegister) {
        this.renderRegister = renderRegister;
    },

    render(sceneManager, cameraManager)
    {
        if (this.stop) return;
        let renderer = this.renderer;
        let renderRegister = this.renderRegister;

        // Util.
        let materials = {};
        let darkenNonBloomed = obj => {
            if (obj.isMesh && obj.userData.bloom !== true) {
                materials[obj.uuid] = obj.material;
                obj.material = this.darkMaterial;
            }
        };
        let restoreMaterial = obj => {
            if (materials[obj.uuid]) {
                obj.material = materials[obj.uuid];
                delete materials[obj.uuid];
            }
        };

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
            let bufferComposer;
            if (this.composers.has(id)) {
                bufferComposer = this.composers.get(id);
            } else {
                bufferComposer = this.createComposer(renderer, bufferScene, bufferCamera, bufferTexture);
                this.composers.set(id, bufferComposer);
            }

            bufferScene.traverse(darkenNonBloomed);
            bufferComposer[0].render();
            bufferScene.traverse(restoreMaterial);
            bufferComposer[1].render();
            // composer.render(); // Double render for camera 1frame lag.
            // composer.render();
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

        // MAIN RENDER
        mainScene.traverse(darkenNonBloomed);
        composer[0].render();
        mainScene.traverse(restoreMaterial);
        composer[1].render();

        // Compute draw calls
        // console.log(renderer.info.render.calls);
        renderer.info.reset();
    },

    resize(width, height) {
        if (!width) width = window.innerWidth;
        if (!height) height = window.innerHeight;
        this.renderer.setSize(width, height);

        this.composers.forEach(cs => {
            for (let i = 0; i < cs.length; ++i) {
                let c = cs[i];
                c.setSize(width, height);
                let pixelRatio = this.renderer.getPixelRatio();
                let r = 'resolution';
                let passes = c.passes;
                passes.forEach(p => {
                    if (!p || !(p instanceof ShaderPass)) return;
                    if (!p.material || !p.material.uniforms) return;
                    if (!p.material.uniforms[r]) return;
                    p.material.uniforms[r].value.x = 1 / (width * pixelRatio);
                    p.material.uniforms[r].value.y = 1 / (height * pixelRatio);
                });
            }
        });
    },

    switchAvatarToScene(/*sceneId*/) {
        // TODO here goes the mesh switch.
        // this.renderRegister;
    },

    cleanup() {
        this.composers.forEach(function() {
            // TODO cleanup composer.
        });
        this.composers = new Map();
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
