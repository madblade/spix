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

App.Model.Server.EntityModel.prototype.addEntity = function(id, updatedEntity, graphics, entities) {
    this.entitiesLoading.add(id);

    switch (updatedEntity.k) {

        case 'player':
            this.loadPlayer(id, updatedEntity, graphics, entities);
            break;

        default:
            console.log('ServerModel::addEntity: Unknown entity type.');
    }

};

// TODO [CRIT] entity removal.
App.Model.Server.EntityModel.prototype.removeEntity = function(id) {
    console.log("To be implemented");
};

App.Model.Server.EntityModel.prototype.updateEntity = function(id, currentEntity, updatedEntity, graphics, entities) {
    // Update positions and rotation
    var p = currentEntity.position;
    var up = updatedEntity.p;
    var animate = p.x !== up[0] || p.y !== up[1];
    p.x = up[0];
    p.y = up[1];
    p.z = up[2];
    currentEntity.rotation.y = Math.PI + updatedEntity.r[0];

    // Update animation
    if (animate) graphics.updateAnimation(id);

    // Update current "live" entities.
    entities.set(id, currentEntity);
};

App.Model.Server.EntityModel.prototype.refresh = function() {
    if (!this.needsUpdate) return;
    var graphics = this.app.engine.graphics;

    var entities = this.entitiesIngame;
    var pushes = this.entitiesOutdated;

    pushes.forEach(function(updatedEntity, id) {

        if (this.entitiesLoading.has(id)) return;

        var currentEntity = entities.get(id);
        //console.log(updatedEntity + ' , ' + id);

        if (!updatedEntity)
            this.removeEntity(id);
        else if (!currentEntity)
            this.addEntity(id, updatedEntity, graphics, entities);
        else
            this.updateEntity(id, currentEntity, updatedEntity, graphics, entities);

    }.bind(this));

    // Flush double buffer.
    this.entitiesOutdated = new Map();

    // Unset dirty flag.
    this.needsUpdate = false;
};

App.Model.Server.EntityModel.prototype.updateEntities = function(entities) {
    if (!entities) { console.log('Empty update @ server.sub.entities.js'); return; }

    var pushes = this.entitiesOutdated;
    for (var eid in entities) {
        pushes.set(eid, entities[eid]);
    }

    // Set dirty flag.
    this.needsUpdate = true;
};
