
'use strict';

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { BackSide, Color, FrontSide, MeshBasicMaterial, MeshPhongMaterial, Object3D } from 'three';

let ItemsModule = {

    loadItems(callback) {
        this.loadItemMesh('portal-gun', callback);
    },

    loadItemMesh(modelPath, callback) {
        if (modelPath !== 'portal-gun' && modelPath !== 'pixel-crossbow') return;

        let loader = new GLTFLoader();
        loader.load(`app/assets/models/${modelPath}.glb`, gltf => {
            if (modelPath === 'portal-gun')
                this.finalizePortalMesh(gltf, callback);
            else if (modelPath === 'pixel-crossbow')
                this.finalizeCrossbowMesh(gltf, callback);
        }, undefined, function(error) {
            console.error(error);
        });
    },

    finalizeCrossbowMesh(gltf, callback) {
        let object = gltf.scene.children[0];
        console.log(object);
        let m = object.material.map;

        // let newMat = new MeshBasicMaterial({
        //     color: new Color(4, 4, 4), map: m});
        // object.material = newMat;
        object.material.side = FrontSide;
        object.material.color = new Color(10, 10, 10);
        m.flatShading = true;

        object.scale.set(0.04, 0.04, 0.04);
        object.rotation.set(0, Math.PI / 4, 0);
        object.position.set(0.4, -.25, -0.15);
        let wrapper = new Object3D();
        wrapper.rotation.reorder('ZYX');
        wrapper.add(object);
        callback(wrapper);
    },

    finalizePortalMesh(gltf, callback) {
        let object = gltf.scene.children[0]; // portal gun
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
    },

    // For composite entities, wrap heavy model parts in higher level structure.
    finalizeModelMesh() {
        // First ey;
    }

};

export { ItemsModule };
