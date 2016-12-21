/**
 *
 */

'use strict';

App.Model.Server.EntityModel.prototype.loadPlayer = function(id, updatedEntity, graphics, entities) {

    graphics.initializeEntity(id, 'steve', function(createdEntity) {
        var object3d = graphics.finalizeEntity(id, createdEntity);

        graphics.scene.add(object3d);

        this.updateEntity(id, object3d, updatedEntity, graphics, entities);
        this.entitiesLoading.delete(id);

    }.bind(this));

};
