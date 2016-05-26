/**
 *
 */

'use strict';

App.Engine.Graphics.prototype.update = function(cp, cr, b, e) {

    //console.log("position: " + c);
    //console.log("blocks: " + b);
    //console.log("entities: " + e);

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
        currentEntity.position.z = -updatedEntity._position[1];
        currentEntity.position.y = updatedEntity._position[2];

        currentEntity.rotation.x = updatedEntity._rotation[1];
        currentEntity.rotation.y = -updatedEntity._rotation[0];

    }.bind(this));

    if (cp !== undefined) {
        // TODO if camera type excludes player
        this.avatar.position.x = cp[0];
        this.avatar.position.z = -cp[1];
        this.avatar.position.y = cp[2];

        this.avatar.rotation.x = cr[1];
        this.avatar.rotation.y = cr[0];

        var camera = this.controls; // Camera wrapper actually
        this.positionCameraBehind(camera, cp);
    }
    // Compare b with this.blocks.
};

App.Engine.Graphics.prototype.positionCameraBehind = function(cameraWrapper, vector) {
    cameraWrapper.position.x = vector[0];
    cameraWrapper.position.z = -vector[1]; // + 10;
    cameraWrapper.position.y = vector[2] + 5;
};

App.Engine.Graphics.prototype.removeObjectFromScene = function(object3D) {
    this.app.scene.remove(object3D);
    object3D.geometry.dispose();
    object3D.geometry = null;
    object3D.material.dispose();
    object3D.material = null;
};
