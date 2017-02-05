/**
 *
 */

'use strict';

extend(App.Model.Server.EntityModel.prototype, {

    loadPlayer: function(id, updatedEntity, graphics, entities) {

        graphics.initializeEntity(id, 'steve', function(createdEntity) {

            var object3D = graphics.finalizeEntity(id, createdEntity);

            var entity = new App.Model.Server.EntityModel.Entity(object3D, parseInt(updatedEntity.w));
            graphics.addToScene(entity.getObject3D(), entity.getWorldId());

            this.updateEntity(id, entity, updatedEntity, graphics, entities);
            this.entitiesLoading.delete(id);

        }.bind(this));

    }

});
