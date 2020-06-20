/**
 * Renderer and composers creation.
 */

'use strict';

import { ClearMaskPass, MaskPass } from 'three/examples/jsm/postprocessing/MaskPass';
import { ClearPass } from 'three/examples/jsm/postprocessing/ClearPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { PCFSoftShadowMap, ShaderMaterial, sRGBEncoding, Vector2, WebGLRenderer } from 'three';
import { ShadowPass } from './ShadowPass';
import { SAOPass } from 'three/examples/jsm/postprocessing/SAOPass';

let RendererFactory = {

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
        finalComposer.addPass(copy);

        return [bloomComposer, finalComposer, composer];
    },

    createMainComposer(rendrr, sc, cam, lights)
    {
        // Anti-alias
        let resolutionX = 1 / window.innerWidth;
        let resolutionY = 1 / window.innerHeight;
        let fxaa = new ShaderPass(FXAAShader);
        let u = 'resolution';
        fxaa.uniforms[u].value.set(resolutionX, resolutionY);

        // let copy = new ShaderPass(CopyShader);

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
        composer.addPass(fxaa);

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

        if (this.shadowMap)
        {
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = PCFSoftShadowMap;
        }

        renderer.autoClear = false;
        renderer.outputEncoding = sRGBEncoding;
        renderer.setClearColor(this.cssToHex('#362c6b'), 1);
        renderer.setSize(window.innerWidth, window.innerHeight);

        renderer.info.autoReset = false;
        return renderer;
    }

};

export { RendererFactory };
