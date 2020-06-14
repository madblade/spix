/**
 *
 */

'use strict';

import {
    VertexColors, FrontSide,
    MeshBasicMaterial, MeshLambertMaterial, MeshPhongMaterial
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
                    vertexColors: VertexColors,
                    color: meta && meta.color ? meta.color : null,
                    // transparent: true,
                    // opacity: 1
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
                let params = {
                    //shading: FlatShading,
                    // color: 0x110011,
                    side: FrontSide,
                    //vertexColors: VertexColors,
                    map: this.textureAtlas,
                    transparent: false
                };
                if (this.rendererManager.shadowVolumes)
                    params.transparent = true;
                material = new MeshLambertMaterial(params);
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
