/**
 *
 */

'use strict';

import {
    VertexColors, FrontSide,
    MeshBasicMaterial, MeshLambertMaterial, MeshPhongMaterial
} from 'three';

let MaterialsModule = {

    createMaterial(whatMaterial, meta, worldId)
    {
        let material;

        switch (whatMaterial)
        {
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
                if (worldId === undefined) worldId = '-1';
                let im = this.instancedMaterials.get(worldId);
                if (!im)
                {
                    let params = {
                        side: FrontSide,
                        map: this.textureAtlas,
                        transparent: false
                    };
                    // if (this.rendererManager.shadowVolumes)
                    //     params.transparent = true;

                    material = new MeshLambertMaterial(params);
                    let materials = [material]; // 0 -> material for main cam
                    // if (worldId === -1) materials.push(material.clone()); // 1 -> material for secondary cam
                    this.instancedMaterials.set(worldId, materials);
                }
                else
                {
                    material = im[0];
                    if (!material)
                    {
                        console.error(`[Materials] Could not get instanced material for ${worldId}.`);
                    }
                }
                break;

            case 'textured-phong-water':
                if (worldId === undefined) worldId = '-1';
                let wm = this.waterMaterials.get(worldId);
                if (!wm)
                {
                    let params = {
                        side: FrontSide,
                        map: this.textureAtlas,
                        transparent: true
                    };
                    material = new MeshLambertMaterial(params);
                    this.waterMaterials.set(worldId, material);
                }
                else
                {
                    material = wm;
                    if (!material)
                    {
                        console.error(`[Materials] Could not get instanced material for ${worldId}.`);
                    }
                }
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
