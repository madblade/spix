/**
 *
 */

'use strict';

import {
    Mesh,
    BoxGeometry, PlaneGeometry
} from 'three';

let MeshesModule = {

    createGeometry(whatGeometry) {
        let geometry;

        switch (whatGeometry) {
            case 'plane':
                geometry = new PlaneGeometry(32, 32, 32, 32);
                break;

            case 'box':
                geometry = new BoxGeometry(0.45, 0.45, 0.45);
                break;

            default:
                geometry = new BoxGeometry(0.5, 0.5, 1);
        }

        return geometry;
    },

    createMesh(geometry, material) {
        return new Mesh(geometry, material);
    }

};

export { MeshesModule };
