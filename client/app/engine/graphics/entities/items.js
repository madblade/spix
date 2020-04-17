
'use strict';

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { MeshPhongMaterial, Object3D } from 'three';

let ItemsModule = {

    loadItems(callback) {
        this.loadItemMesh('portal-gun', callback);
    },

    loadItemMesh(modelPath, callback) {
        if (modelPath !== 'portal-gun') return;

        let loader = new GLTFLoader();
        loader.load(`app/assets/models/${modelPath}.glb`, function(gltf) {
            let object = gltf.scene.children[1]; // portal gun
            object.scale.set(0.08, 0.08, 0.08);
            object.rotation.set(0, Math.PI, 0);
            // object.rotation.reorder('ZYX');
            object.position.set(0.3, -.1, -0.5);
            let c = object.children[0];
            c.material = new MeshPhongMaterial({color: 0x000000});
            c = object.children[1];
            c.material = new MeshPhongMaterial({color: 0x2222aa});
            c = object.children[2];
            c.material = new MeshPhongMaterial({color: 0xffffff});
            c = object.children[3];
            c.material = new MeshPhongMaterial({color: 0x999999});
            let wrapper = new Object3D();
            wrapper.rotation.reorder('ZYX');
            wrapper.add(object);
            callback(wrapper);
        }, undefined, function(error) {
            console.error(error);
        });
    },

    // For composite entities, wrap heavy model parts in higher level structure.
    finalizeModelMesh() {
        // First ey;
    }

};

export { ItemsModule };
