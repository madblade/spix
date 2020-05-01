import { BoxBufferGeometry, DoubleSide, Mesh, MeshBasicMaterial, Vector3 } from 'three';
import { Water } from '../water/water';

let ChunksMeshModule = {

    createChunkMesh(geometry, isWater)
    {
        if (isWater)
        {
            // low-res
            if (this.oneWater) {
                let material = this.createMaterial('textured-phong', 0xaaaaaa);
                material.transparent = true;
                material.opacity = 0.3;
                material.side = DoubleSide;
                return new Mesh(geometry, material);
            }
            this.oneWater = true;
            let nm = new Water(
                geometry,
                {
                    textureWidth: 512,
                    textureHeight: 512,
                    waterNormals: this.waterNormals,
                    alpha: 1.0,
                    sunDirection: new Vector3(0.70707, 0.70707, 0.0),
                    sunColor: 0xffffff,
                    waterColor: 0x0000ff,
                    distortionScale: 3.7,
                    fog: false
                }
            );
            return nm;
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
