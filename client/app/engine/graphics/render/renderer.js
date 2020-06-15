/**
 * Renderer, render layers management.
 */

'use strict';

import extend from '../../../extend.js';
import {
    DoubleSide, sRGBEncoding,
    Vector2,
    MeshBasicMaterial, ShaderMaterial,
    WebGLRenderer, Scene, PlaneBufferGeometry, Mesh, BackSide
} from 'three';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { SAOPass } from 'three/examples/jsm/postprocessing/SAOPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { ClearMaskPass, MaskPass } from 'three/examples/jsm/postprocessing/MaskPass';
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader';
import { ClearPass } from 'three/examples/jsm/postprocessing/ClearPass';
import { ShadowPass } from './ShadowPass';

let RendererManager = function(graphicsEngine)
{
    this.graphics = graphicsEngine;

    // Graphical settings
    this.selectiveBloom = true;
    this.ambientOcclusion = false;
    this.waterReflection = true;
    this.shadowVolumes = false;

    // Cap number of passes.
    this.renderMax = 10;

    this.renderer = this.createRenderer();
    this.renderer.autoClear = false;
    this.composers = new Map();

    // Lightweight screen, camera and scene manager for portals.
    this.renderRegister = [];
    this.stencilScene = new Scene();
    this.stencilScreen = new Mesh(
        new PlaneBufferGeometry(1, 2),
        new MeshBasicMaterial({ color: 0xaaaaaa, side: DoubleSide, transparent: false })
    );
    this.stencilScene.add(this.stencilScreen);

    this.corrupted = 0;
    this.stop = false;
    this.thenstop = false;

    // Bloom
    this.darkMaterial = new MeshBasicMaterial(
        { color: 'black', side: DoubleSide, morphTargets: true }
    );

    if (this.shadowVolumes)
    {
        this.sceneShadows = new Scene();
    }
};

extend(RendererManager.prototype, {

    addToShadows(mesh)
    {
        this.sceneShadows.add(mesh);
    },

    cssToHex(cssColor)
    {
        return 0 | cssColor.replace('#', '0x');
    },

    createPortalComposer(rendrr, sc, cam, target, maskScene, maskCamera)
    {
        let maskPass = new MaskPass(maskScene, maskCamera);
        let clearPass = new ClearPass();
        let clearMaskPass = new ClearMaskPass();
        let copy = new ShaderPass(CopyShader);

        let composer = new EffectComposer(rendrr, target);
        composer.renderTarget1.stencilBuffer = true;
        composer.renderTarget2.stencilBuffer = true;
        let scenePass = new RenderPass(sc, cam);
        scenePass.clear = false;
        maskPass.inverse = false;
        composer.addPass(clearPass);
        composer.addPass(maskPass);
        composer.addPass(scenePass);
        composer.addPass(copy);
        composer.addPass(clearMaskPass);
        // composer.addPass(copy);

        // Anti-alias
        let resolutionX = 1 / window.innerWidth;
        let resolutionY = 1 / window.innerHeight;
        let fxaa = new ShaderPass(FXAAShader);
        let u = 'resolution';
        fxaa.uniforms[u].value.set(resolutionX, resolutionY);
        // composer.addPass(fxaa);
        // composer.addPass(fxaa);
        // composer.addPass(copy);

        // Bloom
        let bloomPass = new UnrealBloomPass(
            new Vector2(window.innerWidth, window.innerHeight),
            1.5, 0.4, 0.85);
        bloomPass.exposure = 0.5;
        bloomPass.threshold = 0.3;
        bloomPass.strength = 1.0;
        bloomPass.radius = 0;
        let bloomComposer = new EffectComposer(rendrr, target);
        bloomComposer.renderToScreen = false;
        bloomComposer.renderTarget1.stencilBuffer = true;
        bloomComposer.renderTarget2.stencilBuffer = true;
        bloomComposer.addPass(clearPass);
        bloomComposer.addPass(maskPass);
        bloomComposer.addPass(scenePass);
        bloomComposer.addPass(clearMaskPass);
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
        let finalComposer = new EffectComposer(rendrr, target);
        finalComposer.renderTarget1.stencilBuffer = true;
        finalComposer.renderTarget2.stencilBuffer = true;
        finalComposer.addPass(clearPass);
        finalComposer.addPass(maskPass);
        finalComposer.addPass(scenePass);
        finalComposer.addPass(bloomMergePass);
        finalComposer.addPass(fxaa);
        finalComposer.addPass(clearMaskPass);

        return [bloomComposer, finalComposer, composer];
    },

    createMainComposer(rendrr, sc, cam, lights)
    {
        let composer = new EffectComposer(rendrr);
        composer.renderTarget1.stencilBuffer = true;
        composer.renderTarget2.stencilBuffer = true;
        let scenePass = new RenderPass(sc, cam);
        let shadowPass;
        if (this.shadowVolumes)
        {
            shadowPass = new ShadowPass(sc, cam, lights, this.sceneShadows);
            composer.addPass(shadowPass);
        }
        else
        {
            composer.addPass(scenePass);
        }
        let copy = new ShaderPass(CopyShader);
        composer.addPass(copy);

        // Anti-alias
        let resolutionX = 1 / window.innerWidth;
        let resolutionY = 1 / window.innerHeight;
        let fxaa = new ShaderPass(FXAAShader);
        let u = 'resolution';
        fxaa.uniforms[u].value.set(resolutionX, resolutionY);
        // composer.addPass(fxaa);
        // composer.addPass(fxaa);

        // Bloom
        let bloomPass = new UnrealBloomPass(
            new Vector2(window.innerWidth, window.innerHeight),
            1.5, 0.4, 0.85);
        bloomPass.exposure = 0.5;
        bloomPass.threshold = 0.3;
        bloomPass.strength = 1.0;
        bloomPass.radius = 0;
        let bloomComposer = new EffectComposer(rendrr);
        bloomComposer.renderTarget1.stencilBuffer = true;
        bloomComposer.renderTarget2.stencilBuffer = true;
        bloomComposer.renderToScreen = false;
        if (this.shadowVolumes)
        {
            bloomComposer.addPass(shadowPass);
        }
        else
        {
            bloomComposer.addPass(scenePass);
        }
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
        let finalComposer = new EffectComposer(rendrr);
        finalComposer.addPass(scenePass);
        finalComposer.addPass(bloomMergePass);
        finalComposer.addPass(fxaa);

        // Ambient occlusion
        let ambientOcclusion = this.ambientOcclusion;
        if (ambientOcclusion) {
            let sao = new SAOPass(sc, cam, false, false);
            sao.params.output = SAOPass.OUTPUT.Default;
            sao.params.saoBias = 0.1;
            sao.params.saoIntensity = 1.8;
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

    createRenderer()
    {
        // Configure renderer
        let renderer = new WebGLRenderer({
            antialias: false,
            alpha: true,
            logarithmicDepthBuffer: this.shadowVolumes
            // precision: 'mediump'
        });

        // renderer.shadowMap.enabled = true;
        // renderer.shadowMap.type = PCFSoftShadowMap;
        renderer.autoClear = false;

        renderer.outputEncoding = sRGBEncoding;
        renderer.setClearColor(this.cssToHex('#362c6b'), 1);
        renderer.setSize(window.innerWidth, window.innerHeight);

        renderer.info.autoReset = false;
        return renderer;
    },

    getRenderRegister()
    {
        return this.renderRegister;
    },

    setRenderRegister(renderRegister)
    {
        this.renderRegister = renderRegister;
    },

    _darkenNonBloomed(obj, materials)
    {
        if (obj.isMesh && obj.userData.bloom !== true) {
            materials[obj.uuid] = obj.material;
            obj.material = this.darkMaterial;
        }
    },

    _restoreMaterial(obj, materials)
    {
        if (materials[obj.uuid]) {
            obj.material = materials[obj.uuid];
            delete materials[obj.uuid];
        }
    },

    _updateSkies(mainCamera)
    {
        let skies = this.graphics.app.model.server.chunkModel.skies;
        skies.forEach((sky, worldId) => {
            // TODO [SKY] manage with other cameras
            this.graphics.updateSunPosition(mainCamera, sky, worldId);
        });
    },

    _updateWaters(cameraManager, renderer, mainScene, mainCam)
    {
        // Update uniforms
        let worlds = this.graphics.app.model.server.chunkModel.worlds;
        let skies = this.graphics.app.model.server.chunkModel.skies;
        let eye = cameraManager.waterCamera.eye;
        worlds.forEach(w => {
            // let sky = skies.get(wid);
            // let sdir = this.graphics.getSunDirection(sky);
            w.forEach(chunk => { let m = chunk.meshes; for (let i = 0; i < m.length; ++i) {
                if (!chunk.water[i]) continue;
                let mi = m[i];
                mi.visible = false;
                // if (mi.material && mi.material.uniforms && mi.material.uniforms.time)
                // {
                //     mi.material.uniforms.eye.value = eye;
                //     mi.material.uniforms.sunDirection.value = sdir;
                //     mi.material.uniforms.time.value += 0.01;
                // }
            }});
        });

        // Update main camera
        this._updateWaterCamera(cameraManager, renderer, mainScene, mainCam);

        // Update display
        worlds.forEach((w, wid) => { w.forEach(chunk => {
            let m = chunk.meshes;
            let sky = skies.get(wid);
            let sdir = this.graphics.getSunDirection(sky);
            for (let i = 0; i < m.length; ++i) {
                if (chunk.water[i])
                {
                    let mi = m[i];
                    mi.visible = true;
                    if (mi.material && mi.material.uniforms && mi.material.uniforms.time)
                    {
                        mi.material.uniforms.eye.value = eye;
                        mi.material.uniforms.sunDirection.value = sdir;
                        mi.material.uniforms.time.value += 0.01;
                    }
                }
            }
        });
        });
    },

    _updateWaterCamera(cameraManager, renderer, mainScene)
    {
        // Update mirror camera
        cameraManager.updateWaterCamera();

        // Perform render
        let scene = mainScene;
        let waterCamera = cameraManager.waterCamera;
        let renderTarget = waterCamera.waterRenderTarget;
        let mirrorCamera = cameraManager.waterCamera.camera;

        // Save
        let currentRenderTarget = renderer.getRenderTarget();
        let currentShadowAutoUpdate = renderer.shadowMap.autoUpdate;
        // let currentXrEnabled = renderer.xr.enabled;
        // scope.visible = false; // single side, no need
        // renderer.xr.enabled = false; // Avoid camera modification and recursion
        renderer.shadowMap.autoUpdate = false; // Avoid re-computing shadows

        renderer.setRenderTarget(renderTarget);
        if (renderer.autoClear === false) renderer.clear();
        renderer.render(scene, mirrorCamera);

        // Restore
        // scope.visible = true; // single side, no need
        // renderer.xr.enabled = currentXrEnabled;
        renderer.shadowMap.autoUpdate = currentShadowAutoUpdate;
        renderer.setRenderTarget(currentRenderTarget);
        // let viewport = camera.viewport;
        // if (viewport !== undefined) {
        //     renderer.state.viewport(viewport);
        // }
    },

    _updateShadows() // cameraManager)
    {
        let graphics = this.graphics;
        let worlds = graphics.app.model.server.chunkModel.worlds;
        let skies = graphics.app.model.server.chunkModel.skies;
        // let eye = cameraManager.waterCamera.eye;
        let eye = graphics.getCameraCoordinates();
        // let eyedir = cameraManager.mainCamera.getCameraForwardVector();
        worlds.forEach((w, wid) => {
            let sky = skies.get(wid);
            let sdir = graphics.getSunDirection(sky);
            sdir.set(-sdir.x, sdir.y, sdir.z).negate();
            w.forEach(chunk => {
                if (!chunk.shadow) return;
                let mi = chunk.shadow;
                if (mi.material && mi.material.uniforms)
                {
                    mi.material.uniforms.lightPosition.value = sdir;
                    mi.material.uniforms.eyePosition.value = eye;
                }
            });
        });
    },

    render(sceneManager, cameraManager)
    {
        if (this.stop) return;
        let renderer = this.renderer;
        let renderRegister = this.renderRegister;

        // Util.
        let materials = {};

        // Render first pass.
        let mainScene = sceneManager.mainScene;
        let mainCamera = cameraManager.mainCamera.getRecorder();

        // Update main camera.
        mainCamera.updateProjectionMatrix();
        mainCamera.updateMatrixWorld();
        mainCamera.matrixWorldInverse.getInverse(mainCamera.matrixWorld);
        mainScene.updateMatrixWorld();

        // Updates.
        try {
            this._updateSkies(mainCamera);
            if (this.waterReflection)
                this._updateWaters(cameraManager, renderer, mainScene, mainCamera);
            // if (this.shadowVolumes)
            this._updateShadows(cameraManager, renderer, mainScene, mainCamera);
        } catch (e) {
            console.error(e);
            this.stop = true;
            return;
        }

        // Render every portal.
        let renderCount = 0;
        let renderMax = this.renderMax;

        let currentPass; let screen1; let screen2; let camera;
        let bufferScene; let bufferCamera; let bufferTexture;
        let otherEnd; let otherSceneId;

        for (let j = 0, m = renderRegister.length; j < m; ++j) {
            currentPass = renderRegister[j];
            bufferScene = currentPass.scene;
            if (!bufferScene) continue;
            bufferScene.updateMatrixWorld();
        }

        let stc = cameraManager.stencilCamera;
        this.stencilScene.updateMatrixWorld();
        this.graphics.cameraManager.moveCameraFromMouse(0, 0, 0, 0);
        for (let i = 0, n = renderRegister.length; i < n; ++i)
        {
            if (renderCount++ > renderMax) break;
            currentPass = renderRegister[i];
            screen1 = currentPass.screen1;
            screen2 = currentPass.screen2;
            camera = currentPass.camera;

            bufferScene = currentPass.scene;
            if (!camera) continue;
            bufferCamera = camera.getRecorder();
            bufferTexture = screen1.getRenderTarget();

            if (!bufferScene)
            {
                if (this.corrupted < 5)
                {
                    console.log(`[Renderer] Could not get buffer scene ${currentPass.sceneId}.`);
                    this.corrupted++;
                }

                // Sometimes the x model would be initialized before the w model.
                if (currentPass.sceneId) { currentPass.scene = sceneManager.getScene(currentPass.sceneId); }
                continue;
            }
            if (!bufferCamera)  { console.log('Could not get buffer camera.'); continue; }
            if (!bufferTexture) { console.log('Could not get buffer texture.'); continue; }

            if (screen2)
            {
                otherSceneId = currentPass.sceneId;
                otherEnd = screen2.getMesh();
                // otherEnd.visible = false;
                sceneManager.removeObject(otherEnd, otherSceneId, true);
            }
            //console.log('[Renderer] Rendering.');
            //screen1.getMesh().updateMatrixWorld();
            //if (screen2) screen2.getMesh().updateMatrixWorld();
            //bufferCamera.updateProjectionMatrix();

            //bufferCamera.updateProjectionMatrix();
            // bufferCamera.updateMatrixWorld();
            //bufferCamera.matrixWorldInverse.getInverse(bufferCamera.matrixWorld);
            // this.graphics.cameraManager.moveCameraFromMouse(0, 0, 0, 0);
            // bufferScene.updateMatrixWorld();

            // Render scene into screen1
            const s1 = screen1.getMesh();
            // s1.updateMatrixWorld();
            // this.stencilScreen.matrixWorld.copy(s1.matrixWorld);
            let sts = this.stencilScreen;
            sts.position.copy(s1.position);
            sts.rotation.copy(s1.rotation);
            sts.updateMatrixWorld();
            // sts.position.set(s1.position.x, s1.position.y + 0.1, s1.position.z);

            // bufferCamera.updateProjectionMatrix();
            // stc.position.copy(bufferCamera.position);
            // stc.rotation.copy(bufferCamera.rotation);
            // bufferCamera.updateMatrixWorld(true);
            stc.matrixWorld.copy(bufferCamera.matrixWorld);
            // stc.updateProjectionMatrix();
            // stc.matrixWorld.copy(bufferCamera.matrixWorld);
            // stc.projectionMatrix.copy(bufferCamera.projectionMatrix);

            // renderer.setRenderTarget(bufferTexture);
            let id = currentPass.id.toString();
            let bufferComposer;
            if (this.composers.has(id)) {
                bufferComposer = this.composers.get(id);
            } else {
                bufferComposer = this.createPortalComposer(
                    renderer, bufferScene, bufferCamera, bufferTexture, this.stencilScene, stc
                );
                this.composers.set(id, bufferComposer);
            }

            if (this.selectiveBloom)
            {
                bufferScene.traverse(obj => this._darkenNonBloomed(obj, materials));
                bufferComposer[0].render();
                bufferScene.traverse(obj => this._restoreMaterial(obj, materials));
                bufferComposer[1].render();
            } else {
                bufferComposer[2].render();
            }
            // s1.visible = false;
            // s1.visible = true;

            if (screen2) {
                sceneManager.addObject(otherEnd, otherSceneId);
                // otherEnd.visible = true;
            }
        }

        // Make composer
        // XXX [PERF] optimise composer creation
        let id = this.graphics.app.model.server.selfModel.worldId.toString();
        let composer;
        if (this.composers.has(id)) {
            composer = this.composers.get(id);
        } else {
            let skies = this.graphics.app.model.server.chunkModel.skies;
            let s = skies.get(id);
            if (s && s.lights)
            {
                composer = this.createMainComposer(renderer, mainScene, mainCamera, s.lights);
                this.composers.set(id, composer);
            }
            else
                return;
        }

        // MAIN RENDER
        if (this.selectiveBloom) {
            mainScene.traverse(obj => this._darkenNonBloomed(obj, materials));
            composer[0].render();
            mainScene.traverse(obj => this._restoreMaterial(obj, materials));
            composer[1].render();
        } else {
            composer[2].render();
        }

        // Compute draw calls
        // console.log(renderer.info.render.calls);
        renderer.info.reset();
    },

    resize(width, height)
    {
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

    // Triggered at the start of a switch-to-world.
    switchAvatarToScene(/*sceneId*/)
    {
        // console.log('Mesh switch');
        // this.renderRegister;
    },

    cleanup()
    {
        this.composers.forEach(function() {
            // XXX [UNLOAD] composer cleanup
        });
        this.composers = new Map();
        this.renderRegister.length = 0;
    }

});

/** Interface with graphics engine. **/

let RenderersModule = {

    createRendererManager()
    {
        return new RendererManager(this);
    }

};

export { RenderersModule };
