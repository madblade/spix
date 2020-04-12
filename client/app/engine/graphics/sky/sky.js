/**
 * Sky object.
 */

'use strict';

import * as THREE from 'three';
import { ShadersModule }  from '../shaders/shaders';
// import extend from '../../../extend.js';

// TODO [CRIT] a non-cube sky, vertical with eternal zenith,
//  but with directional light in the case of a cube earth.
//  I can also make this sun spin.

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
            sunPosition: { value: new THREE.Vector3() },
            // viewInverse: { value: new THREE.Matrix4() },
            cameraPos: { value: new THREE.Vector3() },
            worldCenter: { value: new THREE.Vector3(centerX, centerY, centerZ) },
            cubeRadius: { value: radius }
        },
        vertexShader: ShadersModule.getSkyCubeVertexShader(),
        fragmentShader: ShadersModule.getSkyCubeFragmentShader()
    };

    let material = new THREE.ShaderMaterial({
        fragmentShader: shader.fragmentShader,
        vertexShader: shader.vertexShader,
        uniforms: THREE.UniformsUtils.clone(shader.uniforms),
        side: THREE.DoubleSide
    });

    let geometry = new THREE.BoxBufferGeometry(1, 1, 1);

    THREE.Mesh.call(this, geometry,
        material
        // new THREE.MeshBasicMaterial({
        //     side: THREE.DoubleSide, color: 0x362c6b})
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
            sunPosition: { value: new THREE.Vector3() },
            cameraPos: { value: new THREE.Vector3() }
        },
        vertexShader: ShadersModule.getSkyFlatVertexShader(),
        fragmentShader: ShadersModule.getSkyFlatFragmentShader()
    };

    let material = new THREE.ShaderMaterial({
        fragmentShader: shader.fragmentShader,
        vertexShader: shader.vertexShader,
        uniforms: THREE.UniformsUtils.clone(shader.uniforms),
        side: THREE.DoubleSide
    });

    let geometry = new THREE.BoxBufferGeometry(1, 1, 1);

    THREE.Mesh.call(this, geometry,
        material
    );
};

SkyCube.prototype = Object.create(THREE.Mesh.prototype);
SkyFlat.prototype = Object.create(THREE.Mesh.prototype);

export { SkyFlat, SkyCube };
