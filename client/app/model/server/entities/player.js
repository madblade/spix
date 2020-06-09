/**
 *
 */

'use strict';

import { Entity } from './entity.js';
import { Object3D } from 'three';

let PlayerModule = {

    loadCube(id, updatedEntity, graphics, entities)
    {
        // This should be done in graphics
        let wrapper = new Object3D();
        let cube = graphics.createMesh(
            graphics.createGeometry('box'),
            graphics.createMaterial('flat-phong')
        );
        wrapper.add(cube);
        wrapper.rotation.x = Math.PI / 2;
        wrapper.rotation.y = Math.PI;
        wrapper._id = id;

        let entity = new Entity(id, wrapper,
            parseInt(updatedEntity.w, 10));
        graphics.addToScene(entity.getObject3D(), entity.getWorldId());

        this.updateEntity(id, entity, updatedEntity, graphics, entities);
    },

    loadPlayer(id, updatedEntity, graphics, entities)
    {
        // TODO [GAMEPLAY] add handheld item
        let color = updatedEntity.a ? 0x00ff00 : 0xff0000;
        let createdEntity = graphics.initializeEntity(
            id, 'steve', color
        );
        let object3D = graphics.finalizeEntity(
            id, createdEntity, color
        );

        let entity = new Entity(id, object3D, parseInt(updatedEntity.w, 10));
        graphics.addToScene(entity.getObject3D(), entity.getWorldId());

        this.updateEntity(id, entity, updatedEntity, graphics, entities);
        this.entitiesLoading.delete(id);
    }

};

export { PlayerModule };
