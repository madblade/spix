/**
 *
 */

'use strict';

import {
    BackSide, VertexColors,
    MeshBasicMaterial, MeshLambertMaterial, MeshPhongMaterial, FrontSide
} from 'three';

let MaterialsModule = {

    createMaterial(whatMaterial, meta) {
        let material;

        switch (whatMaterial) {
            case 'flat-phong':
                material = new MeshPhongMaterial({
                    specular: 0xffffff,
                    flatShading: true,
                    vertexColors: VertexColors
                });
                break;

            case 'textured-phong':
                material = new MeshPhongMaterial({
                    //color: 0xffffff, specular: 0xffffff, shininess: 250,
                    //shading: FlatShading,
                    side: FrontSide,
                    //vertexColors: VertexColors,
                    map: this.texture
                });
                break;

            case 'basic-black':
                material = new MeshBasicMaterial({
                    wireframe:true,
                    color:0x000000
                });
                break;

            default: // Block material
                material = new MeshBasicMaterial({
                    color:0xff0000
                });
                console.log(meta);
        }

        return material;
    }

};

export { MaterialsModule };
