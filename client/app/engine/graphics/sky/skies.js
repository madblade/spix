/**
 * Sky management functions.
 */

'use strict';

import * as THREE from 'three';
import { Sky } from './sky';

let SkyModule = {

    createSky()
    {
        let sky = new Sky();
        sky.scale.setScalar(450000);
        return sky;
    },

    createSunSphere()
    {
        let sunSphere = new THREE.Mesh(
            new THREE.SphereBufferGeometry(20000, 16, 8),
            new THREE.MeshBasicMaterial({color: 0xffffff})
        );
        sunSphere.position.y = -700000;
        sunSphere.visible = false;
        return sunSphere;
    },

    // TODO [MILESTONE1] update suns position throughout day and year
    updateSky(
        sky,
        sunSphere,
        turbidity, //: 10,
        rayleigh, //: 2,
        mieCoefficient, //: 0.005,
        mieDirectionalG, //: 0.8,
        luminance, //: 1,
        inclination, // 0.49, elevation / inclination
        azimuth,
        isSunSphereVisible) //: 0.25, Facing front
    {
        let sin = Math.sin;
        let cos = Math.cos;

        let uniforms = sky.material.uniforms;
        uniforms.turbidity.value = turbidity;
        uniforms.rayleigh.value = rayleigh;
        uniforms.luminance.value = luminance;
        uniforms.mieCoefficient.value = mieCoefficient;
        uniforms.mieDirectionalG.value = mieDirectionalG;

        let theta = Math.PI * (inclination - 0.5);
        let phi = 2 * Math.PI * (azimuth - 0.5);
        let distance = 400000;

        sunSphere.position.x = distance * cos(phi);
        sunSphere.position.y = distance * sin(phi) * sin(theta);
        sunSphere.position.z = distance * sin(phi) * cos(theta);

        sunSphere.visible = isSunSphereVisible;

        uniforms.sunPosition.value.copy(sunSphere.position);
    }
};

export { SkyModule };
