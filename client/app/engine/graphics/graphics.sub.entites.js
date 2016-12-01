/**
 *
 */

'use strict';

App.Engine.Graphics.prototype.initializeEntity = function(entityId, model, callbackOnMesh) {
    var loader = new THREE.JSONLoader();
    var mixers = this.mixers;

    loader.load('app/assets/models/' + model + '.json', function(geometry) {
        var mesh = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({
            vertexColors: THREE.FaceColors,
            morphTargets: true
        }));

        mesh.scale.set(1.0, 1.0, 1.0);
        mesh.rotation.x = Math.PI/2;
        mesh.rotation.y = Math.PI;

        var mixer = new THREE.AnimationMixer(mesh);
        var clip = THREE.AnimationClip.CreateFromMorphTargetSequence('run', geometry.morphTargets, 30);
        mixer.clipAction(clip).setDuration(1).play();
        mixers.set(entityId, mixer);

        callbackOnMesh(mesh);
    });
};
