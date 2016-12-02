/**
 *
 */

'use strict';

App.Model.Server.EntityModel.prototype.addPlayer = function(id, updatedEntity, graphics, entities) {

    graphics.initializeEntity(id, 'steve', function(createdEntity) {
        createdEntity._id = id;

        var object3d = graphics.finalizeEntity(createdEntity);

        graphics.scene.add(object3d);

        this.updateEntity(object3d, updatedEntity, graphics, entities);
        this.entitiesLoading.delete(id);

    }.bind(this));

};
