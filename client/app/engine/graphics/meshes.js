/**
 *
 */

'use strict';

import * as THREE from 'three';

var MeshesModule = {

    createGeometry: function(whatGeometry) {
        var geometry;

        switch (whatGeometry) {
            case 'plane':
                geometry = new THREE.PlaneGeometry(32, 32, 32, 32);
                break;

            case 'box':
                geometry = new THREE.BoxGeometry(0.45, 0.45, 0.45);
                break;

            default:
                geometry = new THREE.BoxGeometry(0.5, 0.5, 1);
        }

        return geometry;
    },

    createMesh: function(geometry, material) {
        return new THREE.Mesh(geometry, material);
    }

};

export { MeshesModule };
