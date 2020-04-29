/**
 *
 */

'use strict';

import LegacyJSONLoader from './LegacyJSONLoader';
import {
    AnimationMixer, AnimationClip,
    Object3D, Mesh,
    MeshLambertMaterial, FaceColors, BufferGeometry
} from 'three';

let EntitiesModule = {

    initializeEntity(entityId, model, callbackOnMesh) {
        let loader = new LegacyJSONLoader();
        let mixers = this.mixers;

        // TODO [FFF] export model to format glTF
        loader.load(`app/assets/models/${model}.json`, function(geometry) {
            let bufferGeometry = new BufferGeometry().fromGeometry(geometry);

            let mesh = new Mesh(bufferGeometry, new MeshLambertMaterial({
                vertexColors: FaceColors,
                morphTargets: true
            }));

            mesh.scale.set(1.0, 1.0, 1.0);
            // mesh.castShadow = true;

            let mixer = new AnimationMixer(mesh);
            let clip = AnimationClip.CreateFromMorphTargetSequence(
                'run',
                geometry.morphTargets, 30, false
            );

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
        let up = new Object3D();
        let wrapper = new Object3D();
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
