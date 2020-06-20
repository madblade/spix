/**
 * --- ADAPTED FROM ---
 *
 * @author jbouny / https://github.com/jbouny
 *
 * Work based on :
 * @author Slayvin / http://slayvin.net : Flat mirror for three.js
 * @author Stemkoski / http://www.adelphi.edu/~stemkoski : An implementation of water shader based on the flat mirror
 * @author Jonas Wagner / http://29a.ch/ && http://29a.ch/slides/2012/webglwater/ : Water shader explanations in WebGL
 */

import {
    Color,
    FrontSide,
    Matrix4,
    Mesh,
    ShaderMaterial,
    UniformsLib,
    UniformsUtils,
    Vector3,
} from 'three';
import { ShadersModule } from '../shaders/shaders';

let Water = function(
    graphics, geometry, options, worldId
)
{
    Mesh.call(this, geometry);

    options = options || {};
    let alpha = options.alpha !== undefined ? options.alpha : 1.0;
    let time = options.time !== undefined ? options.time : 0.0;
    let normalSampler = options.waterNormals !== undefined ? options.waterNormals : null;
    let sunDirection = options.sunDirection !== undefined ? options.sunDirection : new Vector3(0.70707, 0.70707, 0.0);
    let sunColor = new Color(options.sunColor !== undefined ? options.sunColor : 0xffffff);
    let waterColor = new Color(options.waterColor !== undefined ? options.waterColor : 0x7F7F7F);
    let eye = options.eye !== undefined ? options.eye : new Vector3(0, 0, 0);
    let size = options.size !== undefined ? options.size : 1.0;
    let distortionScale = options.distortionScale !== undefined ? options.distortionScale : 20.0;
    let side = options.side !== undefined ? options.side : FrontSide;
    let fog = options.fog !== undefined ? options.fog : false;

    let material;
    let waterMaterial = graphics.waterMaterials.get(worldId);
    if (!waterMaterial)
    {
        let mirrorShader =
        {
            uniforms: UniformsUtils.merge([
                UniformsLib.fog,
                UniformsLib.lights,
                {
                    normalSampler: { value: null },
                    mirrorSampler: { value: null },
                    alpha: { value: 1.0 },
                    time: { value: 0.0 },
                    size: { value: size },
                    distortionScale: { value: 20.0 },
                    textureMatrix: { value: new Matrix4() },
                    sunColor: { value: new Color(0x7F7F7F) },
                    sunDirection: { value: new Vector3(0.70707, 0.70707, 0) },
                    eye: { value: new Vector3() },
                    // waterColor: { value: new Color(0x555555) },
                    waterColor: { value: new Color(0x001e0f) }
                }
            ]),
            vertexShader: ShadersModule.getWaterVertexShader(),
            fragmentShader: ShadersModule.getWaterFragmentShader()
        };

        material = new ShaderMaterial({
            fragmentShader: mirrorShader.fragmentShader,
            vertexShader: mirrorShader.vertexShader,
            uniforms: UniformsUtils.clone(mirrorShader.uniforms),
            lights: true,
            transparent: true,
            side,
            fog,
            // wireframe: true
        });

        let renderTarget = graphics.cameraManager.waterCamera.waterRenderTarget;
        let textureMatrix = graphics.cameraManager.waterCamera.textureMatrix;

        material.uniforms.mirrorSampler.value = renderTarget.texture;
        material.uniforms.textureMatrix.value = textureMatrix;
        material.uniforms.alpha.value = alpha;
        material.uniforms.time.value = time;
        material.uniforms.normalSampler.value = normalSampler;
        material.uniforms.sunColor.value = sunColor;
        material.uniforms.waterColor.value = waterColor;
        material.uniforms.sunDirection.value = sunDirection;
        material.uniforms.distortionScale.value = distortionScale;
        material.uniforms.eye.value = eye;

        graphics.waterMaterials.set(worldId, material);
    }
    else
    {
        material = waterMaterial;
    }

    this.renderOrder = 800;

    this.material = material;
};

Water.prototype = Object.create(Mesh.prototype);
Water.prototype.constructor = Water;

export { Water };
