/**
 *
 */

'use strict';

import { AmbientLight, DirectionalLight, HemisphereLight, PointLight } from 'three';

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
                    LightDefaultIntensities.HEMISPHERE
                );
                // light.castShadow = true;
                // light.shadow.mapSize.width = 512;
                // light.shadow.mapSize.height = 512;
                // light.shadow.camera.near = 0.1;
                // light.shadow.camera.far = 50000;
                break;

            case 'hemisphere':
                light = new HemisphereLight(
                    LightDefaultColors.HEMISPHERE_SKY,
                    LightDefaultColors.HEMISPHERE_GROUND,
                    LightDefaultIntensities.DIRECTIONAL
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
