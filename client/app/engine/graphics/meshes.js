/**
 *
 */

'use strict';

import {
    Mesh,
    BoxGeometry, PlaneGeometry, Object3D
} from 'three';
import { ItemType } from '../../model/server/self/items';

let MeshesModule = {

    getItemMesh(itemID)
    {
        let itemName = this.getMeshIDFromItemID(itemID);
        if (itemName) { // It’s a handheld item with a specific mesh
            if (itemID === ItemType.PORTAL_GUN_DOUBLE) {
                // TODO make it purple
            } else if (itemID === ItemType.PORTAL_GUN_SINGLE) {
                // TODO make it blue and orange
            }
            return this.loadReferenceMeshFromMemory(itemName);
        } else { // It’s probably a block.
            let g = this.createGeometry('box');
            let m = this.createMaterial('flat-phong');
            let ms = this.createMesh(g, m);
            ms.scale.set(0.4, 0.4, 0.4);
            ms.position.set(0.4, -.25, -0.25);
            let wrapper = new Object3D();
            wrapper.rotation.reorder('ZYX');
            wrapper.add(ms);
            return wrapper;
        }
    },

    getMeshIDFromItemID(itemID)
    {
        switch (itemID) {
            case ItemType.PORTAL_GUN_SINGLE: return 'portal-gun';
            case ItemType.PORTAL_GUN_DOUBLE: return 'portal-gun';
            case ItemType.YA: return 'ya';
            case ItemType.YARI: return 'yari';
            case ItemType.YUMI: return 'yumi-morph';
            case ItemType.KATANA: return 'katana';
            case ItemType.NAGINATA: return 'naginata';
            case ItemType.NAGAMAKI: return 'nagamaki';
            case ItemType.NODACHI: return 'nodachi';
            default: return;
        }
    },

    loadReferenceMeshes()
    {
        this.referenceMeshes = new Map();
        let meshesToLoad = [
            'portal-gun',
            'yumi-morph', 'ya',
            'yari', 'nagamaki', 'naginata', 'nodachi', 'katana'
        ];
        this._nbMeshesToLoad = meshesToLoad.length + 1;

        meshesToLoad.forEach(id =>
        {
            this.loadItemMesh(id, gltfObject => {
                this.referenceMeshes.set(id, gltfObject);
                this._nbMeshesLoadedOrError++;
            }, () => {
                this._nbMeshesLoadedOrError++;
            });
        });

        this.loadMeshFromJSON('steve', geometry => {
            this.referenceMeshes.set('steve', geometry);
            this._nbMeshesLoadedOrError++;
        }, () => {
            this._nbMeshesLoadedOrError++;
        });
    },

    loadReferenceMeshFromMemory(id)
    {
        if (!this.referenceMeshes.has(id)) {
            console.error(`[Graphics/Meshes] Could not charge a new "${id}" mesh.`);
            return;
        }

        let mesh = this.referenceMeshes.get(id);
        if (!(mesh instanceof Object3D))
            console.warn(`[Graphics/Meshes] "${id}" should be an instance of Object3D.`);

        let clone = mesh.clone();
        clone.rotation.reorder('ZYX');

        let inner = clone.children[0];
        if (inner) this.renderOnTop(inner);
        // if (inner.children) this.renderOnTop(inner.children[0]);
        // for (let i = 0; i < inner.children.length; ++i)
        //     inner.children[i].renderOrder = 9999;

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
