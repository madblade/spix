/**
 *
 */

'use strict';

import {
    AmbientLight, DirectionalLight, HemisphereLight,
    CameraHelper,
    PointLight
} from 'three';

let LightDefaultIntensities = Object.freeze({
    HEMISPHERE: 0.75,
    DIRECTIONAL: 0.125,
    AMBIENT: 1.0
});

let LightDefaultColors = Object.freeze({
    DIRECTIONAL: 0xffffff,
    AMBIENT: 0x0011ee,
    HEMISPHERE_SKY: 0xeeeeff,
    HEMISPHERE_GROUND: 0x777788,
});

let LightModule = {

    createLight(whatLight) {
        let light;

        switch (whatLight) {
            case 'sun':
                light = new DirectionalLight(
                    LightDefaultColors.DIRECTIONAL,
                    LightDefaultIntensities.DIRECTIONAL
                );
                // light.castShadow = true;
                // light.shadow.bias = -0.01;
                // light.shadow.mapSize.width = 4096;
                // light.shadow.mapSize.height = 4096;
                // light.shadow.camera.near = 1;
                // light.shadow.camera.far = 100;
                // light.shadow.camera.top = 100;
                // light.shadow.camera.bottom = -100;
                // light.shadow.camera.left = 100;
                // light.shadow.camera.right = -100;
                // let helper = new CameraHelper(light.shadow.camera);
                // light.add(helper);
                break;

            case 'hemisphere':
                light = new HemisphereLight(
                    LightDefaultColors.HEMISPHERE_SKY,
                    LightDefaultColors.HEMISPHERE_GROUND,
                    LightDefaultIntensities.HEMISPHERE
                );
                break;

            default:
                light = new AmbientLight(
                    LightDefaultColors.AMBIENT,
                    LightDefaultIntensities.AMBIENT
                );
        }

        return light;
    }

};

export { LightModule, LightDefaultIntensities, LightDefaultColors };
