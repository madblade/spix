/**
 *
 */

'use strict';

import * as THREE from 'three';

import { Entity } from './entity.js';

var PlayerModule = {

    loadCube: function(id, updatedEntity, graphics, entities)
    {
        // TODO [LOW] do it in graphics
        var wrapper = new THREE.Object3D();
        var cube = graphics.createMesh(
            graphics.createGeometry('box'),
            graphics.createMaterial('flat-phong')
        );
        wrapper.add(cube);
        wrapper.rotation.x = Math.PI / 2;
        wrapper.rotation.y = Math.PI;
        wrapper._id = id;

        var entity = new Entity(wrapper,
            parseInt(updatedEntity.w, 10));
        graphics.addToScene(entity.getObject3D(), entity.getWorldId());

        this.updateEntity(id, entity, updatedEntity, graphics, entities);
    },

    loadPlayer: function(id, updatedEntity, graphics, entities)
    {
        graphics.initializeEntity(id, 'steve',
            function(createdEntity) {
                var object3D = graphics.finalizeEntity(id, createdEntity);

                var entity = new Entity(object3D, parseInt(updatedEntity.w, 10));
                graphics.addToScene(entity.getObject3D(), entity.getWorldId());

                this.updateEntity(id, entity, updatedEntity, graphics, entities);
                this.entitiesLoading.delete(id);
            }.bind(this));
    }

};

export { PlayerModule };
