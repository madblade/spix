/**
 *
 */

'use strict';

extend(App.Engine.Graphics.prototype, {

    initializeEntity: function(entityId, model, callbackOnMesh) {
        var loader = new THREE.JSONLoader();
        var mixers = this.mixers;

        loader.load('app/assets/models/' + model + '.json', function(geometry) {
            var mesh = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({
                vertexColors: THREE.FaceColors,
                morphTargets: true
            }));

            mesh.scale.set(1.0, 1.0, 1.0);

            var mixer = new THREE.AnimationMixer(mesh);
            var clip = THREE.AnimationClip.CreateFromMorphTargetSequence('run', geometry.morphTargets, 30);
            mixer.clipAction(clip).setDuration(1).play();
            mixers.set(entityId, mixer);

            callbackOnMesh(mesh);
        });
    },

    // For composite entities, wrap heavy model parts in higher level structure.
    finalizeEntity: function(id, createdEntity) {
        // First only manage avatars.
        var up = new THREE.Object3D();
        var wrapper = new THREE.Object3D();
        var head = this.createMesh(
            this.createGeometry('box'),
            this.createMaterial('flat-phong')
        );

        up.rotation.reorder('ZYX');
        up.add(wrapper);
        wrapper.add(createdEntity); // Body.
        wrapper.add(head);

        head.position.y = 1.6;
        wrapper.rotation.x = Math.PI/2;
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

});
