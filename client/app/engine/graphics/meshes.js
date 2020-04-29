/**
 *
 */

'use strict';

import {
    Mesh,
    BoxGeometry, PlaneGeometry
} from 'three';

let MeshesModule = {

    loadReferenceMeshes()
    {
        this.referenceMeshes = new Map();
        let meshesToLoad = [
            'portal-gun',
            'yumi-morph', 'ya',
            'yari', 'nagamaki', 'naginata', 'nodachi', 'katana'
        ];
        this._nbMeshesToLoad = meshesToLoad.length;

        meshesToLoad.forEach(id =>
        {
            this.loadItemMesh(id, gltfObject => {
                this.referenceMeshes.set(id, gltfObject);
                this._nbMeshesLoadedOrError++;
            }, () => {
                this._nbMeshesLoadedOrError++;
            });
        });
    },

    chargeReferenceMesh(id)
    {
        if (!this.referenceMeshes.has(id)) {
            console.error(`[Graphics/Meshes] Could not charge a new "${id}" mesh.`);
            return;
        }

        let mesh = this.referenceMeshes.get(id);
        let clone = mesh.clone();
        clone.rotation.reorder('ZYX');
        return clone;
    },

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
