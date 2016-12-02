/**
 *
 */

'use strict';

App.Model.Server.EntityModel = function(app) {
    this.app = app;

    // Model component
    this.entitiesIngame = new Map();
    this.entitiesOutdated = new Map();
    this.entitiesLoading = new Set();

    // Graphical component
    this.needsUpdate = false;
};

App.Model.Server.EntityModel.prototype.init = function() {};

App.Model.Server.EntityModel.prototype.addEntity = function(updatedEntity, graphics, entities) {
    var id = updatedEntity._id;
    this.entitiesLoading.add(id);

    switch (updatedEntity.k) {

        case 'player':
            this.loadPlayer(id, updatedEntity, graphics, entities);
            break;

        default:
            console.log('ServerModel::addEntity: Unknown entity type.');
    }

};

App.Model.Server.EntityModel.prototype.updateEntity = function(currentEntity, updatedEntity, graphics, entities) {
    // Update positions and rotation
    var p = currentEntity.position;
    var up = updatedEntity.p;

    var animate = p.x !== up[0] || p.y !== up[1];
    p.x = up[0];
    p.y = up[1];
    p.z = up[2];
    currentEntity.rotation.y = Math.PI + updatedEntity.r[0];

    // Update animation
    if (animate) graphics.updateAnimation(updatedEntity._id);

    // Update current "live" entities.
    entities.set(updatedEntity._id, currentEntity);
};

App.Model.Server.EntityModel.prototype.refresh = function() {
    if (!this.needsUpdate) return;
    var graphics = this.app.engine.graphics;

    var entities = this.entitiesIngame;
    var pushes = this.entitiesOutdated;

    pushes.forEach(function(updatedEntity) {

        var id = updatedEntity._id;
        if (this.entitiesLoading.has(id)) return;

        var currentEntity = entities.get(id);
        if (!currentEntity)
            this.addEntity(updatedEntity, graphics, entities);
        else
            this.updateEntity(currentEntity, updatedEntity, graphics, entities);

    }.bind(this));

    // Flush double buffer.
    this.entitiesOutdated = new Map();

    // Unset dirty flag.
    this.needsUpdate = false;
};

App.Model.Server.EntityModel.prototype.updateEntities = function(entities) {
    if (entities === undefined || entities === null) return;

    var pushes = this.entitiesOutdated;
    entities.forEach(function(currentEntity) {
        pushes.set(currentEntity._id, currentEntity);
    });

    // Set dirty flag.
    this.needsUpdate = true;
};
