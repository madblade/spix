/**
 *
 */

'use strict';

import { Entity } from './entity.js';
import { Object3D } from 'three';

let PlayerModule = {

    loadCube(id, updatedEntity, graphics, entities)
    {
        // TODO [LOW] do it in graphics
        let wrapper = new Object3D();
        let cube = graphics.createMesh(
            graphics.createGeometry('box'),
            graphics.createMaterial('flat-phong')
        );
        wrapper.add(cube);
        wrapper.rotation.x = Math.PI / 2;
        wrapper.rotation.y = Math.PI;
        wrapper._id = id;

        let entity = new Entity(wrapper,
            parseInt(updatedEntity.w, 10));
        graphics.addToScene(entity.getObject3D(), entity.getWorldId());

        this.updateEntity(id, entity, updatedEntity, graphics, entities);
    },

    loadPlayer(id, updatedEntity, graphics, entities)
    {
        let createdEntity = graphics.initializeEntity(id, 'steve');
        let object3D = graphics.finalizeEntity(id, createdEntity);

        let entity = new Entity(object3D, parseInt(updatedEntity.w, 10));
        graphics.addToScene(entity.getObject3D(), entity.getWorldId());

        this.updateEntity(id, entity, updatedEntity, graphics, entities);
        this.entitiesLoading.delete(id);
    }

};

export { PlayerModule };
