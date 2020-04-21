/**
 * Sky management functions.
 */

'use strict';

import { SkyFlat, SkyCube } from './sky';
import { SimplePlanet, Atmosphere } from './planet';
import {
    Mesh, MeshBasicMaterial, MeshNormalMaterial,
    BoxBufferGeometry, SphereBufferGeometry, Vector3
} from 'three';
import { WorldType } from '../../../model/server/chunks';

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
        return { mesh: sky };
    },

    createCubeSky(center, radius)
    {
        let sky = new SkyCube(center.x, center.y, center.z, radius);
        sky.scale.setScalar(450000);

        let g = new BoxBufferGeometry(
            2 * radius, 2 * radius, 2 * radius
        );
        let m = new MeshNormalMaterial({wireframe: true});
        let helper = new Mesh(g, m);
        helper.position.y = center.y;
        helper.position.z = center.z;
        helper.position.x = center.x;

        return { mesh: sky, helper };
    },

    createSunSphere()
    {
        let sunSphere = new Mesh(
            new SphereBufferGeometry(20000, 16, 8),
            new MeshBasicMaterial({color: 0xffffff})
        );
        sunSphere.position.y = -700000;
        sunSphere.visible = false;
        return sunSphere;
    },

    // TODO [MILESTONE1] make sky creation api serverwise
    // or seed behaviour
    addSky(worldId, worldMeta)
    {
        if (!worldMeta)
            console.log('[Chunks] Default sky creation.');

        // Sky light.
        // TODO [CRIT] light update
        let light = this.createLight('sun');
        light.position.set(-1, -2, -1);
        light.updateMatrixWorld();
        this.addToScene(light, worldId);
        let light2 = this.createLight('hemisphere');
        light2.position.set(-1, -2, -10);
        light2.updateMatrixWorld();
        this.addToScene(light2, worldId);
        // let light3 = this.createLight();
        // light3.position.set(-1, -2, -10);
        // light3.updateMatrixWorld();
        // this.addToScene(light3, worldId);

        let sunPosition = new Vector3(0, -700000, 0);
        let sky;
        let skyType = worldMeta.type;
        if (skyType === WorldType.CUBE) {
            if (!worldMeta.center || !worldMeta.radius) {
                console.error('[Chunks/NewSky]: No center and radius specified.');
                return;
            }
            if (worldMeta.chunkSizeX !== worldMeta.chunkSizeY ||
                worldMeta.chunkSizeX !== worldMeta.chunkSizeZ) {
                console.error('[Chunks/NewSky]: Cube world must have cube chunks.');
                return;
            }
            let chunkSize = worldMeta.chunkSizeX;
            let center = new Vector3(
                (worldMeta.center.x + 0.5) * chunkSize,
                (worldMeta.center.y + 0.5) * chunkSize,
                (worldMeta.center.z + 0.5) * chunkSize - 1);
            let radius = Math.max(worldMeta.radius, 1) * chunkSize - 1;

            sky = this.createCubeSky(center, radius);
            // let sunSphere = graphics.createSunSphere();
            this.addToScene(sky.mesh, worldId);
            // graphics.addToScene(sky.helper, worldId);
            // graphics.addToScene(sunSphere, worldId);

            // turbidity = 1
            // rayleigh = 0.25   or 0.5 and mieCoeff = 0.0
            // mieDirectionalG = 0.0
            this.updateSky(
                sky.mesh,
                sunPosition,
                10,
                2,
                0.005,
                0.8,
                1.0,
                -0.15, // 0.49; // elevation / inclination
                0.0, // Facing front
                true // isSunSphereVisible
            );
        } else if (skyType === WorldType.FLAT) {
            sky = this.createFlatSky();
            this.addToScene(sky.mesh, worldId);
            this.updateSky(
                sky.mesh,
                sunPosition,
                10,
                2,
                0.005,
                0.8,
                1.0,
                -0.15, // 0.49; // elevation / inclination
                0.0, // Facing front
                true // isSunSphereVisible
            );
        } else {
            console.error('Unsupported sky type.');
            return;
        }

        return sky;
    },

    updateSunPosition(camera, skyObject) {
        let sky = skyObject.mesh;
        if (!sky || !this.distance) return;
        let s = sky;

        let cos = Math.cos;
        let sin = Math.sin;

        let distance = this.distance;
        let phi = skyObject.phi || 0;
        let theta = this.theta;

        phi %= 2 * Math.PI;
        let dist = Math.max(0.1, Math.min(Math.abs(Math.PI - phi), Math.abs(phi)) / Math.PI); // in (0,1)
        phi += 0.0101 * dist;
        skyObject.phi = phi;

        let x = distance * cos(phi);
        let y = distance * sin(phi) * sin(theta);
        let z = distance * sin(phi) * cos(theta);
        let vec3 = new Vector3(x, y, z);

        // TODO [CRIT] update light position

        if (camera.projectionMatrix) {
            // let mat4 = new THREE.Matrix4();
            // mat4.set(
            //     camera.fov, camera.aspect, camera.far, camera.near,
            //     0, 0, 0, 0,
            //     0, 0, 0, 0,
            //     0, 0, 0, 0);
            // mat4.getInverse(camera.projectionMatrix);
            // s.material.uniforms.viewInverse.value.copy(mat4);
            let v = new Vector3();
            camera.getWorldPosition(v);
            s.material.uniforms.cameraPos.value.copy(v);
        }
        s.material.uniforms.sunPosition.value.copy(vec3);
        // Better not touch this!
        // This accounts for skybox translations in sky shaders.
        let p = this.app.model.server.selfModel.position;
        if (!p) return;
        sky.position.set(p[0], p[1], p[2]);
        sky.updateMatrix();
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
