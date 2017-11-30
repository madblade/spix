/**
 *
 */

'use strict';

import * as THREE from 'three';

let MaterialsModule = {

    createMaterial(whatMaterial, meta) {
        let material;

        switch (whatMaterial) {
            case 'flat-phong':
                material = new THREE.MeshPhongMaterial({
                    specular: 0xffffff,
                    shading: THREE.FlatShading,
                    vertexColors: THREE.VertexColors
                });
                break;

            case 'textured-phong':
                material = new THREE.MeshLambertMaterial({
                    //color: 0xffffff, specular: 0xffffff, shininess: 250,
                    //shading: THREE.FlatShading,
                    side: THREE.BackSide,
                    //vertexColors: THREE.VertexColors,
                    map: this.texture
                });
                break;

            case 'basic-black':
                material = new THREE.MeshBasicMaterial({
                    wireframe:true,
                    color:0x000000
                });
                break;

            default: // Block material
                material = new THREE.MeshBasicMaterial({
                    color:0xff0000
                });
                console.log(meta);
        }

        return material;
    }

};

export { MaterialsModule };