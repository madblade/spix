/**
 *
 */

'use strict';

extend(App.Model.Server.EntityModel.prototype, {

    loadPlayer: function(id, updatedEntity, graphics, entities) {

        graphics.initializeEntity(id, 'steve', function(createdEntity) {
            var object3d = graphics.finalizeEntity(id, createdEntity);

            // TODO [CRIT] worldify entities.
            graphics.addToScene(object3d, -1);

            this.updateEntity(id, object3d, updatedEntity, graphics, entities);
            this.entitiesLoading.delete(id);

        }.bind(this));

    }

});
