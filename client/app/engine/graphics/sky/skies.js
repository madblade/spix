/**
 * Sky management functions.
 */

'use strict';

import * as THREE from 'three';
import { SkyFlat, SkyCube } from './sky';
import { SimplePlanet, Atmosphere } from './planet';

let SkyModule = {

    createPlanet()
    {
        let planet = new SimplePlanet();
        let atmosphere = new Atmosphere(planet);
        // atmosphere.render(renderer);
        return {planet, atmosphere};
    },

    createFlatSky()
    {
        let sky = new SkyFlat();
        sky.scale.setScalar(450000);
        this.skyBox = sky;
        return { mesh: sky };
    },

    createCubeSky()
    {
        let center = new THREE.Vector3(0, 0, -8);
        let radius = 0.5 * 16;
        let sky = new SkyCube(center.x, center.y, center.z, radius);
        sky.scale.setScalar(450000);
        this.skyBox = sky;

        let g = new THREE.BoxBufferGeometry(
            2 * radius, 2 * radius, 2 * radius
        );
        let m = new THREE.MeshNormalMaterial({wireframe: true});
        let helper = new THREE.Mesh(g, m);
        helper.position.y = center.y;
        helper.position.z = center.z;
        helper.position.x = center.x;
        this.skyBoxHelper = helper;

        return { mesh: sky, helper };
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

        phi %= 2 * Math.PI;
        let dist = Math.max(0.1, Math.min(Math.abs(Math.PI - phi), Math.abs(phi)) / Math.PI); // in (0,1)
        phi += 0.0101 * dist;
        this.phi = phi;

        let x = distance * cos(phi);
        let y = distance * sin(phi) * sin(theta);
        let z = distance * sin(phi) * cos(theta);
        let vec3 = new THREE.Vector3(x, y, z);

        if (camera.projectionMatrix) {
            // let mat4 = new THREE.Matrix4();
            // mat4.set(
            //     camera.fov, camera.aspect, camera.far, camera.near,
            //     0, 0, 0, 0,
            //     0, 0, 0, 0,
            //     0, 0, 0, 0);
            // mat4.getInverse(camera.projectionMatrix);
            // s.material.uniforms.viewInverse.value.copy(mat4);
            let v = new THREE.Vector3();
            camera.getWorldPosition(v);
            s.material.uniforms.cameraPos.value.copy(v);
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
        sunPosition,
        turbidity, //: 10,
        rayleigh, //: 2,
        mieCoefficient, //: 0.005,
        mieDirectionalG, //: 0.8,
        luminance, //: 1,
        inclination, // 0.49, elevation / inclination
        azimuth,
    ) //: 0.25, Facing front
    {
        let sin = Math.sin;
        let cos = Math.cos;

        let uniforms = sky.material.uniforms;
        if (!uniforms) return;
        uniforms.turbidity.value = turbidity;
        uniforms.rayleigh.value = rayleigh;
        uniforms.luminance.value = luminance;
        uniforms.mieCoefficient.value = mieCoefficient;
        uniforms.mieDirectionalG.value = mieDirectionalG;

        let theta = 0; // 2 * Math.PI * (inclination - 0.5);
        let phi = 4 * Math.PI * (azimuth - 0.5);
        let distance = 400000;

        this.sky = sky;
        this.distance = distance;
        this.phi = phi;
        this.theta = theta;

        sunPosition.x = distance * cos(phi);
        sunPosition.y = distance * sin(phi) * sin(theta);
        sunPosition.z = distance * sin(phi) * cos(theta);

        uniforms.sunPosition.value.copy(sunPosition);
    }
};

export { SkyModule };
