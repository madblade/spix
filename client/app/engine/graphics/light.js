/**
 *
 */

'use strict';

import { AmbientLight, HemisphereLight } from 'three';

let LightModule = {

    createLight(whatLight) {
        let light;

        switch (whatLight) {
            case 'hemisphere':
                light = new HemisphereLight(0xeeeeff, 0x777788, 0.75);
                break;

            default:
                light = new AmbientLight(0x404040);
        }

        return light;
    }

};

export { LightModule };
