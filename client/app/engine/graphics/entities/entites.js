/**
 *
 */

'use strict';

import * as THREE from 'three';

let EntitiesModule = {

    initializeEntity(entityId, model, callbackOnMesh) {
        let loader = new THREE.JSONLoader();
        let mixers = this.mixers;

        loader.load(`app/assets/models/${model}.json`, function(geometry) {
            let mesh = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({
                vertexColors: THREE.FaceColors,
                morphTargets: true
            }));

            mesh.scale.set(1.0, 1.0, 1.0);

            let mixer = new THREE.AnimationMixer(mesh);
            let clip = THREE.AnimationClip.CreateFromMorphTargetSequence('run', geometry.morphTargets, 30);
            mixer.clipAction(clip)
                .setDuration(1)
                .play();
            mixers.set(entityId, mixer);

            callbackOnMesh(mesh);
        });
    },

    // For composite entities, wrap heavy model parts in higher level structure.
    finalizeEntity(id, createdEntity) {
        // First only manage avatars.
        let up = new THREE.Object3D();
        let wrapper = new THREE.Object3D();
        let head = this.createMesh(
            this.createGeometry('box'),
            this.createMaterial('flat-phong')
        );

        up.rotation.reorder('ZYX');
        up.add(wrapper);
        wrapper.add(createdEntity); // Body.
        wrapper.add(head);

        head.position.y = 1.6;
        wrapper.rotation.x = Math.PI / 2;
        wrapper.rotation.y = Math.PI;
        wrapper.position.z = -0.7999;

        up._id = id;
        //delete createdEntity._id;

        up.getWrapper = function() {
            return wrapper;
        };

        up.getHead = function() {
            return head;
        };

        //return wrapper;
        return up;
    }

};

export { EntitiesModule };
