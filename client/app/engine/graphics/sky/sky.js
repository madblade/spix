/**
 * Sky object.
 */

'use strict';

import { ShadersModule }  from '../shaders/shaders';
import {
    UniformsUtils, DoubleSide,
    BoxBufferGeometry, Mesh, ShaderMaterial, Vector3
} from 'three';
// import extend from '../../../extend.js';

// turbidity, 1.0, 20.0, 0.1
// rayleigh, 0.0, 4, 0.001
// mieCoefficient, 0.0, 0.1, 0.001
// mieDirectionalG, 0.0, 1, 0.001
// luminance, 0.0, 2
// inclination, 0, 1, 0.0001
// azimuth, 0, 1, 0.0001

let SkyCube = function(centerX, centerY, centerZ, radius)
{
    let shader = {
        uniforms: {
            luminance: { value: 1 },
            turbidity: { value: 2 },
            rayleigh: { value: 1 },
            mieCoefficient: { value: 0.005 },
            mieDirectionalG: { value: 0.8 },
            sunPosition: { value: new Vector3() },
            // viewInverse: { value: new Matrix4() },
            cameraPos: { value: new Vector3() },
            worldCenter: { value: new Vector3(centerX, centerY, centerZ) },
            cubeRadius: { value: radius - 2 }
        },
        vertexShader: ShadersModule.getSkyCubeVertexShader(),
        fragmentShader: ShadersModule.getSkyCubeFragmentShader()
    };

    let material = new ShaderMaterial({
        fragmentShader: shader.fragmentShader,
        vertexShader: shader.vertexShader,
        uniforms: UniformsUtils.clone(shader.uniforms),
        side: DoubleSide
    });

    let geometry = new BoxBufferGeometry(1, 1, 1);

    Mesh.call(this, geometry,
        material
        // new MeshBasicMaterial({
        //     side: DoubleSide, color: 0x362c6b})
    );
};

let SkyFlat = function()
{
    let shader = {
        uniforms: {
            luminance: { value: 1 },
            turbidity: { value: 10 },
            rayleigh: { value: 1 },
            mieCoefficient: { value: 0.005 },
            mieDirectionalG: { value: 0.8 },
            sunPosition: { value: new Vector3() },
            cameraPos: { value: new Vector3() }
        },
        vertexShader: ShadersModule.getSkyFlatVertexShader(),
        fragmentShader: ShadersModule.getSkyFlatFragmentShader()
    };

    let material = new ShaderMaterial({
        fragmentShader: shader.fragmentShader,
        vertexShader: shader.vertexShader,
        uniforms: UniformsUtils.clone(shader.uniforms),
        side: DoubleSide
    });

    let geometry = new BoxBufferGeometry(1, 1, 1);

    Mesh.call(this, geometry,
        material
    );
};

SkyCube.prototype = Object.create(Mesh.prototype);
SkyFlat.prototype = Object.create(Mesh.prototype);

export { SkyFlat, SkyCube };
