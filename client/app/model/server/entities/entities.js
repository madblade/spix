/**
 *
 */

'use strict';

import extend           from '../../../extend.js';

import { PlayerModule } from './player.js';

let EntityModel = function(app) {
    this.app = app;

    // Model component
    this.entitiesIngame = new Map();
    this.entitiesOutdated = new Map();
    this.entitiesLoading = new Set();

    // Graphical component
    this.needsUpdate = false;
};

extend(EntityModel.prototype, PlayerModule);

extend(EntityModel.prototype, {

    init() {},

    addEntity(id, updatedEntity, graphics, entities) {
        this.entitiesLoading.add(id);

        switch (updatedEntity.k) {

            case 'player':
                this.loadPlayer(id, updatedEntity, graphics, entities);
                break;

            case 'cube':
                this.loadCube(id, updatedEntity, graphics, entities);
                break;

            default:
                console.log('ServerModel::addEntity: Unknown entity type.');
        }
    },

    removeEntity(id, graphics, entities) {
        let entity = entities.get(id);
        if (entity) {
            graphics.removeFromScene(entity.getObject3D(), entity.getWorldId());
        }
        entities.delete(id);
    },

    // TODO [HIGH] an entity model...
    updateEntity(id, currentEntity, updatedEntity, graphics, entities) {
        // Update positions and rotation
        let object3D = currentEntity.getObject3D();

        let p = object3D.position;
        let up = updatedEntity.p;
        let animate = p.x !== up[0] || p.y !== up[1];
        p.x = up[0];
        p.y = up[1];
        p.z = up[2];

        let ur = updatedEntity.r;
        object3D.rotation.x = ur[3];
        object3D.rotation.z = ur[2];
        object3D.getWrapper().rotation.y = Math.PI + ur[0];
        object3D.updateMatrixWorld();

        // Update animation
        if (animate) graphics.updateAnimation(id);

        // Switch worlds.
        let worldId = parseInt(updatedEntity.w, 10);
        if (currentEntity.getWorldId() !== worldId) {
            graphics.removeFromScene(currentEntity.getObject3D(), currentEntity.getWorldId());
            currentEntity.setWorldId(worldId);
            graphics.addToScene(currentEntity.getObject3D(), worldId);
        }

        // Update current "live" entities.
        entities.set(id, currentEntity);
    },

    refresh() {
        if (!this.needsUpdate) return;
        let graphics = this.app.engine.graphics;

        let entities = this.entitiesIngame;
        let pushes = this.entitiesOutdated;

        pushes.forEach(
            function(updatedEntity, id) {
                if (this.entitiesLoading.has(id)) return;

                let currentEntity = entities.get(id);
                if (!updatedEntity)
                    this.removeEntity(id, graphics, entities);
                else if (!currentEntity)
                    this.addEntity(id, updatedEntity, graphics, entities);
                else
                    this.updateEntity(id, currentEntity, updatedEntity, graphics, entities);
            }.bind(this)
        );

        // Flush double buffer.
        this.entitiesOutdated = new Map();

        // Unset dirty flag.
        this.needsUpdate = false;
    },

    updateEntities(entities) {
        if (!entities) { console.log('Empty update @ server.sub.entities.js'); return; }

        let pushes = this.entitiesOutdated;
        for (let eid in entities) {
            pushes.set(eid, entities[eid]);
        }

        // Set dirty flag.
        this.needsUpdate = true;
    }

});

export { EntityModel };
