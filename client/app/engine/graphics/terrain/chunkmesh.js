import {
    BoxBufferGeometry, Mesh, MeshBasicMaterial,
    DoubleSide, Vector3
} from 'three';
import { Water } from '../water/water';

let ChunksMeshModule = {

    createChunkMesh(geometry, isWater, isWorldFlat)
    {
        if (isWater)
        {
            // low-res
            if (!isWorldFlat) {
                let material = this.createMaterial('textured-phong', 0xaaaaaa);
                material.transparent = true;
                material.opacity = 0.5;
                material.side = DoubleSide;
                return new Mesh(geometry, material);
            }
            // this.oneWater = true;
            return new Water(
                this,
                geometry,
                // new PlaneBufferGeometry(32, 32, 1, 1),
                {
                    textureWidth: 512,
                    textureHeight: 512,
                    waterNormals: this.textureWaterNormals,
                    alpha: 0.5,
                    sunDirection: new Vector3(0.70707, 0.70707, 0.0),
                    sunColor: 0xffffff,
                    waterColor: 0x7b8a99,
                    distortionScale: 0.1,
                    size: 10.0,
                    fog: false
                }
            );
            // return nm;
        } else {
            let material = this.createMaterial('textured-phong', 0xaaaaaa);
            return new Mesh(geometry, material);
        }
    },

    createChunkDebugMesh(chunkSizeX, chunkSizeY, chunkSizeZ)
    {
        return new Mesh(
            new BoxBufferGeometry(
                chunkSizeX, chunkSizeY, chunkSizeZ,
                1, 1, 1),
            new MeshBasicMaterial({wireframe: true, color: 0x00ff00})
        );
    }

};

export { ChunksMeshModule };
