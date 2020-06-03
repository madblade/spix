/**
 *
 */

'use strict';

import extend           from '../../../extend.js';

import { PlayerModule } from './player.js';

let EntityModel = function(app)
{
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

    interpolatePredictEntities() {
    },

    interpolatePredictEntity() {
    },

    cerp(a, b, c, d, t)
    {
        const m0 = a ? [c[0] - a[0], c[1] - a[1], c[2] - a[2]] : [c[0] - b[0], c[1] - b[1], c[2] - b[2]];
        const m1 = d ? [d[0] - b[0], d[1] - b[1], d[2] - b[2]] : [c[0] - b[0], c[1] - b[1], c[2] - b[2]];
        return this.catmull(b, c, m0, m1, t);
    },

    catmull(p0, p1, m0, m1, t)
    {
        const t2 = t * t;
        const a = 1 + t2 * (2 * t - 3);
        const b = t * (1 + t2 * (t - 2));
        const c = t2 * (3 - 2 * t);
        const d = t2 * (t - 1);
        return [
            a * p0[0] + b * m0[0] + c * p1[0] + d * m1[0],
            a * p0[1] + b * m0[1] + c * p1[1] + d * m1[1],
            a * p0[2] + b * m0[2] + c * p1[2] + d * m1[2],
        ];
    },

    addEntity(id, updatedEntity, graphics, entities) {
        this.entitiesLoading.add(id);

        switch (updatedEntity.k)
        {
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
    updateEntity(id, currentEntity, updatedEntity, graphics, entities)
    {
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

    refresh()
    {
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

    updateEntities(entities)
    {
        if (!entities) { console.log('Empty update @ server.sub.entities.js'); return; }

        let pushes = this.entitiesOutdated;
        for (let eid in entities) {
            pushes.set(eid, entities[eid]);
        }

        // Set dirty flag.
        this.needsUpdate = true;
    },

    cleanup() {
        this.entitiesIngame.clear();
        this.entitiesOutdated.clear();
        this.entitiesLoading.clear();
        this.needsUpdate = false;
        // TODO [LEAK] cleanup graphical component and all meshes.
    }

});

export { EntityModel };
