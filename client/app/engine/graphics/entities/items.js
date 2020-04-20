
'use strict';

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { BackSide, Color, DataTexture, FrontSide, MeshPhongMaterial, Object3D, RepeatWrapping, RGBFormat, Vector2 } from 'three';

let ItemsGraphicsModule = {

    loadItems(callback) {
        this.loadItemMesh('portal-gun', callback);
    },

    loadItemMesh(modelPath, callback) {
        if (modelPath !== 'portal-gun' &&
            modelPath !== 'pixel-crossbow' &&
            modelPath !== 'katana') return;

        let loader = new GLTFLoader();
        loader.load(`app/assets/models/${modelPath}.glb`, gltf => {
            if (modelPath === 'portal-gun')
                this.finalizePortalMesh(gltf, callback);
            else if (modelPath === 'pixel-crossbow')
                this.finalizeCrossbowMesh(gltf, callback);
            else if (modelPath === 'katana')
                this.finalizeKatanaMesh(gltf, callback);
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
        // Render on top
        object.renderOrder = 9999;
        object.onBeforeRender = function(renderer) {renderer.clearDepth();};

        object.scale.set(0.04, 0.04, 0.04);
        object.rotation.set(0, Math.PI / 4, 0);
        object.position.set(0.4, -.25, -0.15);
        let wrapper = new Object3D();
        wrapper.rotation.reorder('ZYX');
        wrapper.add(object);
        callback(wrapper);
    },

    finalizeKatanaMesh(gltf, callback) {
        let object = gltf.scene.children[0];
        console.log(object);
        // let m = object.material.map;

        // let newMat = new MeshBasicMaterial({
        //     color: new Color(4, 4, 4), map: m});
        // object.material = newMat;
        object.children[0].material.roughness = 1.0; //; 0.3;
        object.children[0].material.metalness = 1.0; // 0.5;
        object.children[0].material.emissive = new Color(0x212121);

        let width = 32; let height = 32;
        let size = width * height;
        let data = new Uint8Array(3 * size);
        for (let i = 0; i < size; ++i) {
            let stride = i * 3;
            let r = i % 30 > 10 ? 255 : 0;
            data[stride] = r;
            data[stride + 1] = r;
            data[stride + 2] = r;
        }
        let tex = new DataTexture(data, width, height, RGBFormat);
        tex.wrapT = RepeatWrapping;
        tex.wrapS = RepeatWrapping;
        // tex.repeat.set(9, 1);
        object.children[0].material.roughnessMap = tex;
        object.children[0].material.map = tex;
        object.children[0].material.needsUpdate = true;

        let g = object.children[0].geometry;
        g.faceVertexUvs = [[]];
        for (let i = 0; i < 8; ++i) {// 8 faces
            g.faceVertexUvs[0].push( // x
                [new Vector2(0, 0), new Vector2(0, 1), new Vector2(1, 0)]
            );
            g.faceVertexUvs[0].push( // y
                [new Vector2(0, 1), new Vector2(1, 1), new Vector2(1, 0)]
            );
            g.faceVertexUvs[0].push( // z
                [new Vector2(1, 0), new Vector2(0, 0), new Vector2(0, 1)]
            );
        }
        g.uvsNeedUpdate = true;
        g.needsUpdate = true;


        // Think about setting roughness
        object.scale.set(0.08, 0.08, 0.08);
        // object.rotation.set(0, Math.PI / 4, 0);
        object.position.set(0.4, -.25, -0.25);
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

export { ItemsGraphicsModule };
