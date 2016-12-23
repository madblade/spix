/**
 *
 */

'use strict';

App.Model.Server.EntityModel.prototype.loadPlayer = function(id, updatedEntity, graphics, entities) {

    graphics.initializeEntity(id, 'steve', function(createdEntity) {
        var object3d = graphics.finalizeEntity(id, createdEntity);

        graphics.addToScene(object3d); // TODO [CRIT] couple with knot model.

        this.updateEntity(id, object3d, updatedEntity, graphics, entities);
        this.entitiesLoading.delete(id);

    }.bind(this));

};
