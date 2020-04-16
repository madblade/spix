
'use strict';

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

let ItemsModule = {

    loadItems(callback) {
        this.loadItemMesh('portal-gun', callback);
    },

    loadItemMesh(modelPath, callback) {
        if (modelPath !== 'portal-gun') return;

        let loader = new GLTFLoader();
        loader.load(`app/assets/models/${modelPath}.glb`, function(gltf) {
            let object = gltf.scene;
            object.scale.set(0.08, 0.08, 0.08);
            object.rotation.set(0, 0, 0);
            object.position.set(-0.3, 1.0, 0.15);
            callback(object);
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
