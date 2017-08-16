/**
 *
 */

'use strict';

extend(App.Model.Server.EntityModel.prototype, {

    loadCube: function(id, updatedEntity, graphics, entities) {

        // TODO [LOW] do it in graphics
        var wrapper = new THREE.Object3D();
        var cube = graphics.createMesh(
            graphics.createGeometry('box'),
            graphics.createMaterial('flat-phong')  
        );
        wrapper.add(cube);
        wrapper.rotation.x = Math.PI/2;
        wrapper.rotation.y = Math.PI;
        wrapper._id = id;

        var entity = new App.Model.Server.EntityModel.Entity(wrapper, parseInt(updatedEntity.w));
        graphics.addToScene(entity.getObject3D(), entity.getWorldId());

        this.updateEntity(id, entity, updatedEntity, graphics, entities);
    },
    
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
