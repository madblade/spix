
'use strict';

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import {
    AnimationClip,
    AnimationMixer,
    BufferAttribute, Color, DataTexture, LoopRepeat,
    MeshPhongMaterial,
    Object3D, RepeatWrapping, RGBFormat,
} from 'three';

let ItemsGraphicsModule = {

    loadItems(callback)
    {
        this.loadItemMesh('portal-gun', callback);
    },

    loadItemMesh(modelPath, callback, errorCallback)
    {
        if (modelPath !== 'portal-gun' &&
            modelPath !== 'yumi-morph' &&
            modelPath !== 'yari' &&
            modelPath !== 'ya' &&
            modelPath !== 'nagamaki' &&
            modelPath !== 'naginata' &&
            modelPath !== 'nodachi' &&
            modelPath !== 'katana'
        ) {
            console.error('[Graphics/Items] Unsupported mesh.');
            return;
        }

        let loader = new GLTFLoader();
        loader.load(`app/assets/models/${modelPath}.glb`, gltf => {
            if (modelPath === 'portal-gun')
                this.finalizePortalMesh(gltf, callback);
            else if (modelPath === 'katana')
                this.finalizeKatanaPackMesh(gltf, callback);
            else if (modelPath === 'ya')
                this.finalizeYaPackMesh(gltf, callback);
            else if (modelPath === 'yumi-morph')
                this.finalizeYumiMorphPackMesh(gltf, callback);
            else if (modelPath === 'yari')
                this.finalizeYariPackMesh(gltf, callback);
            else if (modelPath === 'nagamaki')
                this.finalizeNagamakiPackMesh(gltf, callback);
            else if (modelPath === 'naginata')
                this.finalizeNaginataPackMesh(gltf, callback);
            else if (modelPath === 'nodachi')
                this.finalizeNodachiPackMesh(gltf, callback);
        }, undefined, function(error) {
            if (errorCallback) errorCallback();
            console.error(error);
        });
    },

    finalizeYumiMorphPackMesh(gltf, callback)
    {
        let object = gltf.scene.children[0];
        this._resetMaterial(object, true);

        // Read animation
        object.material.morphTargets = true;
        let mixer = new AnimationMixer(object);
        let clip = new AnimationClip(
            'bow-stretch', 1, gltf.animations[0].tracks);
        // console.log(clip);

        let action = mixer.clipAction(clip);
        action.clampWhenFinished = true;
        action.setDuration(1)
            .setLoop(LoopRepeat, 1)
            .play();
        this.mixers.set('yumi', mixer);
        this.times.set('yumi', Date.now());
        this.clips.set('yumi', action);

        // Color mesh
        let g = object.geometry;
        let p = g.attributes.position;
        let count = p.count;
        g.setAttribute('color',
            new BufferAttribute(new Float32Array(count * 3), 3)
        );
        let colors = g.attributes.color;
        for (let i = 0; i < count; ++i)
        {
            let x; let y; let z;
            let yCoord = p.getY(i);
            if (Math.abs(yCoord - 5.85) < .3 ||
                Math.abs(yCoord - 2.46) < .1 ||
                Math.abs(yCoord - 8) < .1)
            {
                x = y = z = 2.0;
            } else {
                x = 2 * 61 / 256;
                y = 2 * 31 / 256;
                z = 0;
            }
            colors.setXYZ(i, x, y, z);
        }

        object.rotation.reorder('ZXY');
        let sc = object.scale; let f = 0.2;
        sc.set(f * sc.x, f * sc.y, f * sc.z);
        object.rotation.set(-Math.PI / 2, Math.PI / 2, Math.PI / 2);
        object.position.set(0.3, -.15, -0.25);

        this.renderOnTop(object);
        let wrapper = new Object3D();
        wrapper.rotation.reorder('ZYX');
        wrapper.add(object);
        callback(wrapper);
    },

    finalizeYaPackMesh(gltf, callback)
    {
        let object = gltf.scene.children[0];
        this._resetMaterial(object);

        let g = object.geometry;
        let p = g.attributes.position;
        let count = p.count;
        g.setAttribute('color',
            new BufferAttribute(new Float32Array(count * 3), 3)
        );
        let colors = g.attributes.color;
        for (let i = 0; i < count; ++i)
        {
            let x; let y; let z;
            let xCoord = p.getX(i); let yCoord = p.getY(i);
            if (xCoord < -15.4) {
                x = y = z = 1.0;
            } else if (xCoord > -3 && Math.abs(yCoord) > 0.02) {
                x = y = z = 2.0;
            } else {
                x = 61 / 256;
                y = 31 / 256;
                z = 0;
            }
            colors.setXYZ(i, x, y, z);
        }

        let sc = object.scale;
        let wrapper = this._packObject(object);
        const f = 6;
        sc.set(f * sc.x, f * sc.y, f * sc.z);
        object.position.set(0, -1.5, 0);
        callback(wrapper);
    },

    _resetMaterial(object, opaque)
    {
        object.material = new MeshPhongMaterial({
            color: 0x707070,
            shininess: opaque ? 0 : 1000,
            specular: opaque ? 0x000000 : 0xffffff,
            vertexColors: true
        });
        let g = object.geometry;
        let count = g.attributes.position.count;
        g.setAttribute('color',
            new BufferAttribute(new Float32Array(count * 3), 3)
        );
    },

    _packObject(object)
    {
        // Think about setting roughness
        object.rotation.reorder('ZYX');
        let sc = object.scale; let f = 0.4;
        sc.set(f * sc.x, f * sc.y, f * sc.z);
        object.rotation.set(Math.PI + 5.0 * Math.PI / 8, 0, -Math.PI / 2);
        object.position.set(0.4, -.25, -0.25);

        let wrapper = new Object3D();
        wrapper.rotation.reorder('ZYX');
        wrapper.add(object);
        return wrapper;
    },

    finalizeKatanaTypePackMesh(gltf,
        handleTop, handleR, handleG, handleB,
        ringTop, ringLeft, ringRight, ringR, ringG, ringB,
        callback)
    {
        let object = gltf.scene.children[0];
        this._resetMaterial(object);

        let g = object.geometry;
        let p = g.attributes.position;
        let count = p.count;
        let colors = g.attributes.color;
        for (let i = 0; i < count; ++i)
        {
            let x; let y; let z;
            let xCoord = p.getX(i); let yCoord = p.getY(i); let zCoord = p.getZ(i);
            if (xCoord < ringTop) {
                x = 0.5 + 0.5 * Math.random();
                y = 0.5 + 0.5 * Math.random();
                z = 0.5 + 0.5 * Math.random();
            } else if (xCoord > handleTop &&
                Math.abs(zCoord) < ringLeft && Math.abs(yCoord) < ringRight)
            {
                x = handleR / 256;
                y = handleG / 256;
                z = handleB;
            } else {
                x = ringR / 256;
                y = ringG / 256;
                z = ringB;
            }
            colors.setXYZ(i, x, y, z);
        }

        let wrapper = this._packObject(object);
        callback(wrapper);
    },

    finalizeYariPackMesh(gltf, callback)
    {
        this.finalizeKatanaTypePackMesh(gltf,
            -9.7, 61, 31, 0,
            -15.7,
            0.7, 0.05,
            255, 215, 0,
            callback);
    },

    finalizeNodachiPackMesh(gltf, callback)
    {
        this.finalizeKatanaTypePackMesh(gltf,
            -1.3, 61, 31, 0,
            -1.975,
            0.7, 0.05,
            255, 215, 0,
            callback);
    },

    finalizeNaginataPackMesh(gltf, callback)
    {
        this.finalizeKatanaTypePackMesh(gltf,
            -7.8, 61, 31, 0,
            -8.47,
            0.7, 0.07,
            255, 215, 0,
            callback);
    },

    finalizeNagamakiPackMesh(gltf, callback)
    {
        this.finalizeKatanaTypePackMesh(gltf,
            -2.4, 61, 31, 0,
            -3.052,
            0.7, 0.09,
            255, 215, 0,
            callback);
    },

    finalizeKatanaPackMesh(gltf, callback)
    {
        this.finalizeKatanaTypePackMesh(gltf,
            -1.3, 0, 0, 0,
            -1.975, 0.7, 0.09,
            255, 215, 0,
            callback);
    },

    /**
     * @deprecated
     */
    finalizeKatanaMesh(gltf, callback)
    {
        let object = gltf.scene.children[0];
        console.log(object);
        // let m = object.material.map;

        // let newMat = new MeshBasicMaterial({
        //     color: new Color(4, 4, 4), map: m});
        // object.material = newMat;
        object.children[0].material.roughness = 1.0; //; 0.3;
        object.children[0].material.metalness = 0.5; // 0.5;
        object.children[0].material.color = new Color(0xffffff);
        // object.children[0].material.side = BackSide;

        let width = 128; let height = 128;
        let size = width * height;
        let data = new Uint8Array(3 * size);
        for (let i = 0; i < size; ++i) {
            let stride = i * 3;
            // let r = i < size / 2 ? 255 : Math.random() * 255;
            let r = Math.random() > 0.5 ? 255 : 0;
            data[stride] = r;
            data[stride + 1] = r;
            data[stride + 2] = r;
        }
        let tex = new DataTexture(data, width, height, RGBFormat);
        tex.wrapT = RepeatWrapping;
        tex.wrapS = RepeatWrapping;
        tex.repeat.set(9, 1);
        object.children[0].material.roughnessMap = tex;
        // object.children[0].material.metalnessMap = tex;
        // object.children[0].material.map = tex;
        object.children[0].material.needsUpdate = true;

        let g = object.children[0].geometry;
        // g.faceVertexUvs = [[]];
        let uvs = new Float32Array(72 * 2);
        for (let i = 0; i < 72; ++i) { // 8 faces
            uvs.set([Math.random(), Math.random()], i);
        }
        g.setAttribute('uv', new BufferAttribute(uvs, 2));
        g.attributes.uv.needsUpdate = true;
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

    // [OPT] make it a single mesh
    finalizePortalMesh(gltf, callback)
    {
        let object = gltf.scene.children[0]; // portal gun
        object.scale.set(0.08, 0.08, 0.08);
        object.rotation.set(0, Math.PI, 0);
        // object.rotation.reorder('ZYX');
        object.position.set(0.3, -.1, -0.5);
        let c1 = object.children[0];
        c1.material = new MeshPhongMaterial({color: 0x000000});
        let c2 = object.children[1];
        c2.material = new MeshPhongMaterial({color: 0x2222aa});
        let c3 = object.children[2];
        c3.material = new MeshPhongMaterial({color: 0xffffff});
        let c4 = object.children[3];
        c4.material = new MeshPhongMaterial({color: 0x999999});

        let wrapper = new Object3D();
        wrapper.rotation.reorder('ZYX');
        wrapper.add(object);
        callback(wrapper);
    },

    // For composite entities, wrap heavy model parts in higher level structure.
    finalizeModelMesh()
    {
        // First ey;
    }

};

export { ItemsGraphicsModule };
