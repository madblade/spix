/**
 *
 */

'use strict';

import { Entity } from './entity.js';
import { Object3D } from 'three';
import { ItemType } from '../self/items';

let PlayerModule = {

    loadArrow(
        id, updatedEntity, graphics, entities
    )
    {
        let wrapper = new Object3D();
        let cube = graphics.getItemMesh(ItemType.YA, false);
        wrapper.add(cube);
        wrapper.rotation.x = Math.PI / 2;
        wrapper.rotation.y = Math.PI;
        wrapper._id = id;

        let up = new Object3D();
        up.rotation.reorder('ZYX');
        up.add(wrapper);
        wrapper.rotation.x = Math.PI / 2;
        wrapper.rotation.y = Math.PI;
        up._id = id;
        //delete createdEntity._id;
        up.getWrapper = function() {
            return wrapper;
        };

        let entity = new Entity(
            id, up,
            parseInt(updatedEntity.w, 10)
        );
        graphics.addToScene(entity.getObject3D(), entity.getWorldId());

        this.updateEntity(id, entity, updatedEntity, graphics, entities);
        this.entitiesLoading.delete(id);
    },

    loadCube(id, updatedEntity, graphics, entities)
    {
        // This should be done in graphics
        let wrapper = new Object3D();
        let cube = graphics.createMesh(
            graphics.createGeometry('box'),
            graphics.createMaterial('flat-phong', 0x5e2c04)
        );
        wrapper.add(cube);
        wrapper.rotation.x = Math.PI / 2;
        wrapper.rotation.y = Math.PI;
        wrapper._id = id;

        let up = new Object3D();
        up.rotation.reorder('ZYX');
        up.add(wrapper);
        wrapper.rotation.x = Math.PI / 2;
        wrapper.rotation.y = Math.PI;
        up._id = id;
        //delete createdEntity._id;
        up.getWrapper = function() {
            return wrapper;
        };

        let entity = new Entity(
            id, up,
            parseInt(updatedEntity.w, 10)
        );
        graphics.addToScene(entity.getObject3D(), entity.getWorldId());

        this.updateEntity(id, entity, updatedEntity, graphics, entities);
        this.entitiesLoading.delete(id);
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
