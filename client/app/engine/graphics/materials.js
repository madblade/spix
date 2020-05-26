/**
 *
 */

'use strict';

import {
    BackSide, MeshStandardMaterial, Color,
    VertexColors,
    MeshBasicMaterial, MeshLambertMaterial, MeshPhongMaterial, FrontSide,
} from 'three';

let MaterialsModule = {

    createMaterial(whatMaterial, meta)
    {
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
                // material = new MeshPhongMaterial({
                //shading: FlatShading,
                // color: 0x110011,
                // emissive: new Color(0, 0, 0),
                // specular: new Color(0, 0, 0),
                // shininess: 0,
                // side: FrontSide,
                //vertexColors: VertexColors,
                // map: this.texture
                // });
                material = new MeshLambertMaterial({
                    //shading: FlatShading,
                    // color: 0x110011,
                    side: FrontSide,
                    //vertexColors: VertexColors,
                    map: this.textureAtlas
                });
                break;

            case 'basic-black':
                material = new MeshBasicMaterial({
                    wireframe:true,
                    color: 0x000000
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
