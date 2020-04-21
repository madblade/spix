/**
 *
 */

'use strict';

import { AmbientLight, DirectionalLight, HemisphereLight, PointLight } from 'three';

let LightModule = {

    createLight(whatLight) {
        let light;

        switch (whatLight) {
            case 'sun':
                light = new DirectionalLight(0xffffff, 0.25);
                // light.castShadow = true;
                // light.shadow.mapSize.width = 512;
                // light.shadow.mapSize.height = 512;
                // light.shadow.camera.near = 0.1;
                // light.shadow.camera.far = 50000;
                break;

            case 'hemisphere':
                light = new HemisphereLight(0xeeeeff, 0x777788, 0.5);
                break;

            default:
                light = new AmbientLight(0xffffff);
        }

        return light;
    }

};

export { LightModule };
