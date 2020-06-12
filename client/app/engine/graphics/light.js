/**
 *
 */

'use strict';

import {
    AmbientLight, CameraHelper, DirectionalLight, DirectionalLightHelper, HemisphereLight,
} from 'three';

let LightDefaultIntensities = Object.freeze({
    HEMISPHERE: 0.125,
    DIRECTIONAL: 0.5,
    AMBIENT: 1.0
});

let LightDefaultColors = Object.freeze({
    DIRECTIONAL: 0xffffff,
    AMBIENT: 0x0011ee,
    HEMISPHERE_SKY: 0xeeeeff,
    HEMISPHERE_GROUND: 0x777788,
});

let LightModule = {

    createLight(whatLight)
    {
        let light;

        switch (whatLight) {
            case 'sun':
                light = new DirectionalLight(
                    LightDefaultColors.DIRECTIONAL,
                    LightDefaultIntensities.DIRECTIONAL
                );
                light.castShadow = true;
                light.shadow.bias = -0.004;
                light.shadow.mapSize.width = 2048;
                light.shadow.mapSize.height = 2048;
                light.shadow.camera.near = 1;
                light.shadow.camera.far = 200;
                light.shadow.camera.top = 32;
                light.shadow.camera.bottom = -32;
                light.shadow.camera.left = 32;
                light.shadow.camera.right = -32;
                // (!) this helper is not accurate
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
