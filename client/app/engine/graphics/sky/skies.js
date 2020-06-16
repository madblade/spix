/**
 * Sky management functions.
 */

'use strict';

import { SkyFlat, SkyCube } from './sky';
import {
    Mesh, MeshBasicMaterial, MeshNormalMaterial,
    BoxBufferGeometry, SphereBufferGeometry, Vector3, Color
} from 'three';
import { WorldType } from '../../../model/server/chunks';
import {
    LightDefaultColors, LightDefaultIntensities
} from '../light';

let SkyModule = {

    createFlatSky(worldId)
    {
        // Mesh
        let sky = new SkyFlat();
        sky.scale.setScalar(450000);

        // Light
        let lights = this.createSkyLight(
            new Vector3(-1, -2, -1), 'flat', worldId
        );

        return { mesh: sky, lights };
    },

    createCubeSky(center, radius)
    {
        // Mesh
        let sky = new SkyCube(center.x, center.y, center.z, radius);
        sky.scale.setScalar(450000);

        // Colored cube helper
        let g = new BoxBufferGeometry(2 * radius, 2 * radius, 2 * radius);
        let m = new MeshNormalMaterial({wireframe: true});
        let helper = new Mesh(g, m);
        helper.position.y = center.y;
        helper.position.z = center.z;
        helper.position.x = center.x;

        // Light
        let lights = this.createSkyLight(
            new Vector3(-1, -2, -1), 'cube'
        );

        return { mesh: sky, helper, lights };
    },

    createSkyLight(sunPosition, lightType, worldId)
    {
        // Dir
        let light1 = this.createLight('sun', worldId, lightType);
        // light1.position.set(-1, -2, -1);
        let np = new Vector3();
        np.copy(sunPosition)
            .normalize();
        light1.position.set(np.x, np.y, np.z);
        light1.position.set(0, 0, 0);
        // light1.updateMatrixWorld();
        // Hemisphere
        let light2 = this.createLight('hemisphere');
        // light2.position.set(-1, -2, -10);
        light2.position.set(np.x, np.y, np.z);
        // light2.updateMatrixWorld();
        // Ambient
        let light3 = this.createLight();
        // light3.position.set(-1, -2, -10);
        light3.position.set(np.x, np.y, np.z);
        // light3.updateMatrixWorld();
        return {
            directionalLight: light1,
            hemisphereLight: light2,
            ambientLight: light3,
            type: lightType
        };
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

    addSky(worldId, worldMeta)
    {
        if (!worldMeta)
            console.log('[Chunks] Default sky creation.');

        let sunPosition = new Vector3(0, -700000, 0);

        let sky;
        let skyType = worldMeta.type;
        if (skyType === WorldType.CUBE)
        {
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
            this.addToScene(sky.mesh, worldId);
            this.addToScene(sky.lights.hemisphereLight, worldId);
            this.addToScene(sky.lights.directionalLight, worldId);
            // this.addToScene(sky.helper, worldId);
            // let sunSphere = this.createSunSphere();
            // this.addToScene(sunSphere, worldId);

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
        }
        else if (skyType === WorldType.FLAT || skyType === WorldType.FANTASY)
        {
            sky = this.createFlatSky(worldId);
            this.addToScene(sky.mesh, worldId);
            this.addToScene(sky.lights.hemisphereLight, worldId);
            this.addToScene(sky.lights.directionalLight, worldId);
            // this.addToScene(sky.lights.ambientLight, worldId);

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
        }
        else
        {
            console.error('Unsupported sky type.');
            return;
        }

        return sky;
    },

    getSunDirection(skyObject)
    {
        let distance = this.distance;
        let phi = skyObject.phi || 0;
        let theta = this.theta;
        let x = distance * Math.cos(phi);
        let y = distance * Math.sin(phi) * Math.sin(theta);
        let z = distance * Math.sin(phi) * Math.cos(theta);
        let sunDirection = new Vector3(-x, y, z);
        sunDirection.normalize().negate();
        return sunDirection;
    },

    // XXX [SKY] sync (or seed?) sun position from server
    updateSunPosition(camera, skyObject, worldId)
    {
        let sky = skyObject.mesh;
        if (!sky || !this.distance) return;
        let s = sky;

        let cos = Math.cos;
        let sin = Math.sin;

        let distance = this.distance;
        let phi = skyObject.phi || 0;
        let theta = this.theta;

        phi %= 2 * Math.PI;
        // let dist = Math.max(0.1,
        // Math.min(Math.abs(Math.PI - phi),
        // Math.abs(phi)) / Math.PI); // in (0,1)
        phi += 0.000101; // * dist;
        // phi = Math.PI / 2; // * dist;
        skyObject.phi = phi;

        let x = distance * cos(phi);
        let y = distance * sin(phi) * sin(theta);
        let z = distance * sin(phi) * cos(theta);
        let sunPosition = new Vector3(x, y, z);

        let camPosition;
        if (camera.projectionMatrix)
        {
            // let mat4 = new THREE.Matrix4();
            // mat4.set(
            //     camera.fov, camera.aspect, camera.far, camera.near,
            //     0, 0, 0, 0,
            //     0, 0, 0, 0,
            //     0, 0, 0, 0);
            // mat4.getInverse(camera.projectionMatrix);
            // s.material.uniforms.viewInverse.value.copy(mat4);
            camPosition = new Vector3();
            camera.getWorldPosition(camPosition);
            s.material.uniforms.cameraPos.value.copy(camPosition);
        }
        s.material.uniforms.sunPosition.value.copy(sunPosition);
        // Better not touch this!
        // This accounts for skybox translations in sky shaders.
        let model = this.app.model.server;
        let p = model.selfModel.position;
        if (!p) return;
        sky.position.copy(p);
        sky.updateMatrix();

        let worldMeta = model.chunkModel.worldProperties.get(worldId);
        let isWorldFlat = worldMeta.type === WorldType.FLAT;

        // Update lights
        let normSunPosition = new Vector3();
        normSunPosition.copy(sunPosition)
            .normalize();
        let hl = skyObject.lights.hemisphereLight;
        let dl = skyObject.lights.directionalLight;

        hl.position.copy(normSunPosition);
        dl.position.copy(normSunPosition).multiplyScalar(60);

        if (isWorldFlat && camPosition && this.hasShadowMap())
        {
            let dp = dl.position;
            dp.set(
                dp.x + camPosition.x,
                dp.y + camPosition.y,
                dp.z
            );
            dl.target.position.set(
                camPosition.x,
                camPosition.y,
                0
            );
            dl.target.updateMatrixWorld();
        }

        // Sunset and sunrise
        if (skyObject.lights.type === 'flat')
        {
            let nz = Math.max(normSunPosition.z, 0);
            let intensityFactor = Math.pow(nz, 0.1);
            hl.intensity = LightDefaultIntensities.HEMISPHERE * intensityFactor;
            dl.intensity = LightDefaultIntensities.DIRECTIONAL * intensityFactor;
            if (nz === 0) {
                let onz = Math.max(-normSunPosition.z, 0);
                intensityFactor = Math.pow(onz, 0.1);
                hl.position.copy(new Vector3(0, 0, -1));
                hl.intensity = intensityFactor * 0.3;
                dl.intensity = 0;
                hl.groundColor = new Color(0x0000ff);
                hl.skyColor = new Color(0x0000ff);
            } else {
                hl.skyColor = new Color(LightDefaultColors.HEMISPHERE_SKY);
                hl.groundColor = new Color(LightDefaultColors.HEMISPHERE_GROUND);
            }
        }
    },

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
