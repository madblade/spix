/**
 * Sky management functions.
 */

'use strict';

import * as THREE from 'three';
import { Sky } from './sky';
import { SimplePlanet, Atmosphere } from './planet';

let SkyModule = {

    createPlanet()
    {
        let planet = new SimplePlanet();
        let atmosphere = new Atmosphere(planet);
        // atmosphere.render(renderer);
        return {planet, atmosphere};
    },

    createSky()
    {
        let sky = new Sky();
        sky.scale.setScalar(450000);
        this.skyBox = sky;
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

    updateSunPosition(camera) {
        if (!this.sky || !this.distance) return;
        let s = this.sky;

        let cos = Math.cos;
        let sin = Math.sin;

        let distance = this.distance;
        let phi = this.phi;
        let theta = this.theta;
        // phi += 0.0001;
        this.phi = phi;

        let x = distance * cos(phi);
        let y = distance * sin(phi) * sin(theta);
        let z = distance * sin(phi) * cos(theta);
        let vec3 = new THREE.Vector3(x, y, z);

        if (camera.projectionMatrix) {
            let mat4 = new THREE.Matrix4();
            mat4.set(
                camera.fov, camera.aspect, camera.far, camera.near,
                0, 0, 0, 0,
                0, 0, 0, 0,
                0, 0, 0, 0);
            // mat4.getInverse(camera.projectionMatrix);
            s.material.uniforms.viewInverse.value.copy(mat4);
        }
        s.material.uniforms.sunPosition.value.copy(vec3);
        // Better not touch this!
        // This accounts for skybox translations in sky shaders.
        let p = this.app.model.server.selfModel.position;
        if (!p) return;
        this.skyBox.position.set(p[0], p[1], p[2]);
        this.skyBox.updateMatrix();
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

        // TODO [CRIT] remove hack
        // TODO [CRIT] remove temporary hack
        this.sky = sky;
        this.distance = distance;
        this.phi = phi;
        this.theta = theta;

        sunSphere.position.x = distance * cos(phi);
        sunSphere.position.y = distance * sin(phi) * sin(theta);
        sunSphere.position.z = distance * sin(phi) * cos(theta);

        sunSphere.visible = isSunSphereVisible;

        uniforms.sunPosition.value.copy(sunSphere.position);
    }
};

export { SkyModule };
