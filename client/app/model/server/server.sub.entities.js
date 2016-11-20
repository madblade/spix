/**
 *
 */

'use strict';

App.Model.Server.EntityModel = function(app) {
    this.app = app;

    // Model component
    this.entityStates = new Map();
    this.entityPushes = new Map();

    // Graphical component
    this.needsUpdate = false;
};

App.Model.Server.EntityModel.prototype.init = function() {};

App.Model.Server.EntityModel.prototype.refresh = function() {
    if (!this.needsUpdate) return;
    var graphics = this.app.engine.graphics;

    var entities = this.entityStates;
    var pushes = this.entityPushes;
    pushes.forEach(function(updatedEntity) {
        var currentEntity = entities.get(updatedEntity._id);
        if (currentEntity === undefined) {
            currentEntity = graphics.createMesh(graphics.createGeometry(), graphics.createMaterial());
            currentEntity.name = currentEntity._id;
            graphics.scene.add(currentEntity);
        }

        currentEntity.position.x = updatedEntity._position[0];
        currentEntity.position.y = updatedEntity._position[1];
        currentEntity.position.z = updatedEntity._position[2]+.5;
        currentEntity.rotation.z = updatedEntity._rotation[0];

        // Update current "live" entities.
        entities.set(updatedEntity._id, updatedEntity);
    });

    // Flush double buffer.
    this.entityPushes = new Map();

    // Unset dirty flag.
    this.needsUpdate = false;
};

App.Model.Server.EntityModel.prototype.updateEntities = function(entities) {
    if (entities === undefined || entities === null) return;
    var pushes = this.entityPushes;
    entities.forEach(function(currentEntity) {
        pushes.set(currentEntity._id, currentEntity);
    });

    // Set dirty flag.
    this.needsUpdate = true;
};
