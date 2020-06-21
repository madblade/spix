/**
 * Renderer, render layers management.
 */

'use strict';

import extend from '../../../extend.js';
import {
    DoubleSide,
    MeshBasicMaterial,
    Scene, PlaneBufferGeometry, Mesh,
} from 'three';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { RendererFactory } from './renderer.factory';
import { RendererUpdates } from './renderer.updates';
import { LightDefaultIntensities } from '../light';

let RendererManager = function(graphicsEngine)
{
    this.graphics = graphicsEngine;

    // Graphical settings
    this.selectiveBloom = true;
    this.waterReflection = true;

    // To disable water reflection, but not the moving water texture
    this.shortCircuitWaterReflection = false;

    // Shadows:
    // - not compatible with portals
    // - only for blocks
    // - shadow map =
    //          soft shadows, capped distance, flickering at the edges
    //          ~=CPU load
    //          ++GPU load (adding a render pass + depends on tex resolution).
    // - shadow volumes =
    //          crisp shadows, stable and high-fidelity
    //          not yet working with non-manifold edges
    //          ++CPU load at chunk create/update.
    //          +++GPU load (adding render passes + fill time).
    this.shadowVolumes = false;
    this.shadowMap = false;
    this.highResolutionShadowMap = false;
    if (this.shadowVolumes && this.shadowMap)
    {
        console.error('[Renderer] Cannot use both shadow map and shadow volume.');
        this.shadowVolumes = false;
    }

    // ISSUES
    // Performance issue with Firefox + three (water reflection)
    // const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
    // if (isFirefox)
    //     this.shortCircuitWaterReflection = true;
    // Bloom + light intensity issue on mobile
    const isMobile = 'ontouchstart' in window || navigator.msMaxTouchPoints > 0;
    if (isMobile)
    {
        this.selectiveBloom = false;
        LightDefaultIntensities.HEMISPHERE *= 4;
        LightDefaultIntensities.DIRECTIONAL *= 4;
        LightDefaultIntensities.AMBIENT *= 4;
    }
    // \ISSUES

    // No support for AO atm.
    this.ambientOcclusion = false;

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
    this.darkWater = new MeshBasicMaterial(
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

    removeFromShadows(mesh)
    {
        this.sceneShadows.remove(mesh);
    },

    cssToHex(cssColor)
    {
        return 0 | cssColor.replace('#', '0x');
    },

    getRenderRegister()
    {
        return this.renderRegister;
    },

    setRenderRegister(renderRegister)
    {
        this.renderRegister = renderRegister;
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
            this.updateSkies(mainCamera);
            if (this.waterReflection)
            {
                // get main
                let currentWid = this.graphics.app.model.server.selfModel.worldId.toString();
                if (currentWid === '-1')
                    this.updateWaters(cameraManager, renderer, mainScene, mainCamera);
                else
                {
                    for (let j = 0, m = renderRegister.length; j < m; ++j)
                    {
                        const pass = renderRegister[j];
                        let sc = pass.scene;
                        if (!sc) continue;
                        sceneId = pass.sceneId.toString();
                        if (sceneId === '-1')
                        {
                            let cm = pass.camera.cameraObject;
                            this.updateWaters(cameraManager, renderer, sc, cm);
                            break;
                        }
                    }
                }
            }
            if (this.shadowVolumes)
                this.updateShadows(cameraManager, renderer, mainScene, mainCamera);
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
        let otherEnd;
        // let otherSceneId;

        // This fixes the 1-frame lag for inner-most scenes.
        for (let j = 0, m = renderRegister.length; j < m; ++j)
        {
            currentPass = renderRegister[j];
            bufferScene = currentPass.scene;
            if (!bufferScene) continue;

            // Latencx fix for inner scenes.
            bufferScene.updateMatrixWorld();

            // Flickering fix for linking to the same scene.
            // bufferCamera = currentPass.camera.getRecorder();
            // bufferCamera.updateProjectionMatrix();
            // bufferCamera.updateMatrixWorld();
        }

        let stencilCamera = cameraManager.stencilCamera;
        this.stencilScene.updateMatrixWorld();
        this.graphics.cameraManager.moveCameraFromMouse(0, 0, 0, 0);

        let worlds = this.graphics.app.model.server.chunkModel.worlds;
        let pathId;
        let sceneId;
        let instancedMaterials = this.graphics.instancedMaterials;
        let waterMaterials = this.graphics.waterMaterials;
        for (let i = 0, n = renderRegister.length; i < n; ++i)
        {
            if (renderCount++ > renderMax) break;
            currentPass = renderRegister[i];
            screen1 = currentPass.screen1;
            screen2 = currentPass.screen2;
            camera = currentPass.camera;
            sceneId = currentPass.sceneId.toString();
            pathId = currentPass.id;
            let defaultMaterials = instancedMaterials.get(sceneId);
            let defaultMaterial;
            let defaultWaterMaterial;
            if (!defaultMaterials) {
                // console.error('[Renderer] Default material not found!');
            } else {
                defaultMaterial = defaultMaterials[0];
                defaultWaterMaterial = waterMaterials.get(sceneId);
            }
            let passMaterial = instancedMaterials.get(pathId);
            let passWaterMaterial = waterMaterials.get(pathId);
            if (!passMaterial && defaultMaterial)
            {
                passMaterial = defaultMaterial.clone();
                instancedMaterials.set(pathId, passMaterial);
                if (defaultWaterMaterial)
                {
                    passWaterMaterial = defaultWaterMaterial.clone();
                    waterMaterials.set(pathId, passWaterMaterial);
                }
            }
            let chks = worlds.get(sceneId);
            if (!chks)
            {
                // console.log('No chunks there.');
            }

            bufferScene = currentPass.scene;
            if (!camera) continue;
            bufferCamera = camera.getRecorder();
            bufferTexture = screen1.getRenderTarget();

            if (!bufferScene)
            {
                if (this.corrupted < 5)
                {
                    // console.log(`[Renderer] Could not get buffer scene ${currentPass.sceneId}.`);
                    // Happens while loading other worlds.
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
                // otherSceneId = currentPass.sceneId;
                otherEnd = screen2.getMesh();
                otherEnd.visible = false;
                // sceneManager.removeObject(otherEnd, otherSceneId, true);
            }
            //console.log('[Renderer] Rendering.');
            //screen1.getMesh().updateMatrixWorld();
            //if (screen2) screen2.getMesh().updateMatrixWorld();
            //bufferCamera.updateProjectionMatrix();

            //bufferCamera.updateProjectionMatrix();
            // bufferCamera.updateMatrixWorld();
            //bufferCamera.matrixWorldInverse.getInverse(bufferCamera.matrixWorld);
            // this.graphics.cameraManager.moveCameraFromMouse(0, 0, 0, 0);

            // Render scene into screen1
            const s1 = screen1.getMesh();
            // s1.updateMatrixWorld();
            // this.stencilScreen.matrixWorld.copy(s1.matrixWorld);
            let sts = this.stencilScreen;
            let t = camera.getCameraTransform();
            sts.position.copy(s1.position);
            sts.position.x += t[0];
            sts.position.y += t[1];
            sts.position.z += t[2];
            sts.rotation.copy(s1.rotation);
            // sts.rotation.y += t[3];
            sts.updateMatrixWorld();
            // sts.position.set(s1.position.x, s1.position.y + 0.1, s1.position.z);

            // bufferCamera.updateProjectionMatrix();
            // stc.position.copy(bufferCamera.position);
            // stc.rotation.copy(bufferCamera.rotation);
            // bufferCamera.updateMatrixWorld(true);
            stencilCamera.matrixWorld.copy(bufferCamera.matrixWorld);
            // stc.matrixWorld.copy(bufferCamera.matrixWorld);
            // stc.projectionMatrix.copy(bufferCamera.projectionMatrix);

            // renderer.setRenderTarget(bufferTexture);
            let id = currentPass.id.toString();
            let bufferComposer;
            if (this.composers.has(id)) {
                bufferComposer = this.composers.get(id);
            } else {
                bufferComposer = this.createPortalComposer(
                    renderer, bufferScene, bufferCamera, bufferTexture, this.stencilScene, stencilCamera
                );
                this.composers.set(id, bufferComposer);
            }

            if (chks && defaultMaterial && passMaterial)
                chks.forEach(c => { let m = c.meshes; for (let cc = 0; cc < m.length; ++cc) {
                    let mi = m[cc];
                    if (!mi) continue;
                    if (c.water[cc])
                    {
                        // mi.material = passWaterMaterial;
                    }
                    else if (mi.material)
                    {
                        mi.material = passMaterial;
                    }
                }});
            s1.visible = false;
            if (this.selectiveBloom)
            {
                bufferScene.traverse(obj => this.darkenNonBloomed(obj, materials));
                bufferComposer[0].render();
                bufferScene.traverse(obj => this.restoreMaterial(obj, materials));
                bufferComposer[1].render();
            } else {
                bufferComposer[2].render();
            }
            s1.visible = true;
            if (chks && defaultMaterial && passMaterial)
                chks.forEach(c => { let m = c.meshes; for (let cc = 0; cc < m.length; ++cc) {
                    let mi = m[cc];
                    if (!mi) continue;
                    if (c.water[cc])
                    {
                        // mi.material = defaultWaterMaterial;
                    }
                    else if (mi.material)
                    {
                        mi.material = defaultMaterial;
                    }
                }});

            if (screen2) {
                // sceneManager.addObject(otherEnd, otherSceneId);
                otherEnd.visible = true;
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
            mainScene.traverse(obj => this.darkenNonBloomed(obj, materials));
            composer[0].render();
            mainScene.traverse(obj => this.restoreMaterial(obj, materials));
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

extend(RendererManager.prototype, RendererFactory);
extend(RendererManager.prototype, RendererUpdates);

/** Interface with graphics engine. **/

let RenderersModule = {

    createRendererManager()
    {
        return new RendererManager(this);
    },

    hasShadowMap()
    {
        return this.rendererManager.shadowMap;
    },

    hasHighResShadows()
    {
        return this.rendererManager.highResolutionShadowMap;
    },

    hasShadowVolumes()
    {
        return this.rendererManager.shadowVolumes;
    }

};

export { RenderersModule };
