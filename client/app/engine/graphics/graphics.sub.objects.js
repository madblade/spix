/**
 *
 */

'use strict';

App.Engine.Graphics.prototype.updateGraphicEntities = function(cp, cr, e) {

    if (e !== undefined && e !== null)
    e.forEach(function(updatedEntity) {
        var currentEntity;

        if (this.entities.hasOwnProperty(updatedEntity._id)) {
            // Update mesh
            currentEntity = this.entities[updatedEntity._id];
        } else {
            // Make mesh
            currentEntity = this.entities[updatedEntity._id] = this.getMesh(this.getGeometry(), this.getMaterial());
            this.scene.add(currentEntity);
        }

        currentEntity.position.x = updatedEntity._position[0];
        currentEntity.position.y = updatedEntity._position[1];
        currentEntity.position.z = updatedEntity._position[2]+0.5;

        currentEntity.rotation.z = updatedEntity._rotation[0];

    }.bind(this));

    if (cp !== undefined && this.controls !== null) {
        // TODO exclude player according to camera type.
        this.avatar.position.x = cp[0];
        this.avatar.position.y = cp[1];
        this.avatar.position.z = cp[2]+0.5;

        this.avatar.rotation.z = cr[0];

        var camera = this.controls; // Camera wrapper actually
        this.positionCameraBehind(camera, cp);
    }
    // Compare b with this.blocks.
};

App.Engine.Graphics.prototype.updateGraphicChunks = function(b) {
    // TODO build surface from blocks.
    console.log("Updating chunk.");
};

App.Engine.Graphics.prototype.positionCameraBehind = function(cameraWrapper, vector) {
    cameraWrapper.position.x = vector[0];
    cameraWrapper.position.y = vector[1]; // + 10;
    cameraWrapper.position.z = vector[2] + 1;
};

App.Engine.Graphics.prototype.removeObjectFromScene = function(object3D) {
    this.app.scene.remove(object3D);
    object3D.geometry.dispose();
    object3D.geometry = null;
    object3D.material.dispose();
    object3D.material = null;
};
