/**
 * Sky object.
 */

'use strict';

import * as THREE from 'three';
import { ShadersModule }  from '../shaders/shaders';
// import extend from '../../../extend.js';

let Sky = function()
{
    // "turbidity", 1.0, 20.0, 0.1
    // "rayleigh", 0.0, 4, 0.001
    // "mieCoefficient", 0.0, 0.1, 0.001
    // "mieDirectionalG", 0.0, 1, 0.001
    // "luminance", 0.0, 2
    // "inclination", 0, 1, 0.0001
    // "azimuth", 0, 1, 0.0001
    // "sun"

    let shader = {
        uniforms: {
            luminance: { value: 1 },
            turbidity: { value: 2 },
            rayleigh: { value: 1 },
            mieCoefficient: { value: 0.005 },
            mieDirectionalG: { value: 0.8 },
            sunPosition: { value: new THREE.Vector3() },
            viewInverse: { value:new THREE.Matrix4() }
        },
        vertexShader: ShadersModule.getSkyVertexShader(),
        fragmentShader: ShadersModule.getSkyFragmentShader()
    };

    let material = new THREE.ShaderMaterial({
        fragmentShader: shader.fragmentShader,
        vertexShader: shader.vertexShader,
        uniforms: THREE.UniformsUtils.clone(shader.uniforms),
        side: THREE.DoubleSide
    });

    // material = new THREE.MeshNormalMaterial({wireframe:true});

    let geometry = new THREE.BoxBufferGeometry(1, 1, 1);

    THREE.Mesh.call(this, geometry,
        material
        // new THREE.MeshBasicMaterial({color: 0xffffff})
    );
};

Sky.prototype = Object.create(THREE.Mesh.prototype);

export { Sky };
