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

    // Interpolation-prediction
    // -> Moved per-entity.
    // this.lastServerUpdateTime = this.getTime();
    // this.averageDeltaT = -1;
};

extend(EntityModel.prototype, PlayerModule);

extend(EntityModel.prototype, {

    init() {},

    interpolatePredictEntities()
    {
        const updateTime = this.getTime();
        let entities = this.entitiesIngame;
        entities.forEach(entity => {
            if (!entity.needsUpdate) return;
            this.interpolatePredictEntity(entity, updateTime);
        });
    },

    interpolatePredictEntity(entity, updateTime)
    {
        let upToDatePosition = entity.position;
        let upToDateRotation = entity.rotation;
        let currentP = entity.currentPFromServer;
        let currentR = entity.currentRFromServer;
        let lastP = entity.lastPFromServer;
        let lastR = entity.lastRFromServer;
        if (currentP.distanceTo(upToDatePosition) > 0 ||
            currentR.distanceTo(upToDateRotation) > 0)
        {
            lastP.copy(currentP);
            currentP.copy(upToDatePosition);
            lastR.copy(currentR);
            currentR.copy(upToDateRotation);
            entity.lastUpdateTime = updateTime;

            // if (this.averageDeltaT < 16 || this.averageDeltaT > 100) {
            entity.averageDeltaT = updateTime - entity.lastServerUpdateTime;
            // }
            entity.lastServerUpdateTime = updateTime;
        }
        const deltaServer = entity.averageDeltaT;

        const t = updateTime - entity.lastUpdateTime;
        if (t < deltaServer)
        {
            // interpolate
            const tdt = t / deltaServer;
            const dpx = currentP.x - lastP.x;
            let drx = currentR.x - lastR.x;
            if (drx > Math.PI) drx = 2 * Math.PI - drx;
            if (drx < -Math.PI) drx += 2 * Math.PI;
            const dpy = currentP.y - lastP.y;
            const dry = currentR.y - lastR.y;
            const dpz = currentP.z - lastP.z;
            const drz = currentR.z - lastR.z;
            this.setLerp(
                entity,
                lastP.x + tdt * dpx, lastP.y + tdt * dpy, lastP.z + tdt * dpz,
                lastR.x + tdt * drx, lastR.y + tdt * dry, lastR.z + tdt * drz,
            );
        }
        else if (
            entity.interpolatingP.distanceTo(currentP) > 0 ||
            entity.interpolatingR.distanceTo(currentR) > 0)
        {
            this.setLerp(
                entity,
                currentP.x, currentP.y, currentP.z,
                currentR.x, currentR.y, currentR.z
            );
            entity.needsUpdate = false;
        }
    },

    setLerp(
        entity, px, py, pz, rx, ry, rz
    )
    {
        entity.interpolatingP.set(px, py, pz);
        entity.interpolatingR.set(rx, ry, rz);
        this.updateGraphicalEntity(entity, entity.interpolatingP, entity.interpolatingR);
    },

    updateGraphicalEntity(currentEntity, newP, newR)
    {
        // Update positions and rotation
        let object3D = currentEntity.getObject3D();

        let p = object3D.position;
        let animate = p.x !== newP.x || p.y !== newP.y;
        // TODO [ANIMATION] link animation to 3D gravity
        p.copy(newP);

        object3D.rotation.x = newR.z; // ur[3];
        object3D.rotation.z = newR.y; // ur[2];
        object3D.getWrapper().rotation.y = Math.PI + newR.x; // + ur[0];
        object3D.updateMatrixWorld();

        // Update animation
        const id = currentEntity.id;
        let graphics = this.app.engine.graphics;
        if (animate) graphics.updateAnimation(id);
    },

    addEntity(id, updatedEntity, graphics, entities)
    {
        this.entitiesLoading.add(id);

        switch (updatedEntity.k)
        {
            case 'ia':
            case 'player':
                this.loadPlayer(id, updatedEntity, graphics, entities);
                break;

            case 'projectile': // TODO [GAMEPLAY] arrow mesh
            case 'cube':
                this.loadCube(id, updatedEntity, graphics, entities);
                break;

            default:
                console.log(`
                    ServerModel::addEntity: Unknown entity type '${updatedEntity.k}'.
                `);
        }
    },

    removeEntity(id, graphics, entities)
    {
        let entity = entities.get(id);
        if (entity) {
            graphics.removeFromScene(entity.getObject3D(), entity.getWorldId());
        }
        entities.delete(id);
    },

    updateEntity(id, currentEntity, updatedEntity, graphics, entities)
    {
        let pos = currentEntity.position;
        let rot = currentEntity.rotation;

        let up = updatedEntity.p;
        let ur = updatedEntity.r;
        if (!pos || !rot ||
            pos[0] !== up[0] || pos[1] !== up[1] || pos[2] !== up[2] ||
            rot[0] !== ur[0] || rot[1] !== ur[2] || rot[2] !== ur[3]) // shifted
        {
            currentEntity.position.set(up[0], up[1], up[2]);
            currentEntity.rotation.set(ur[0], ur[2], ur[3]);
            currentEntity.needsUpdate = true;
        }

        // Switch worlds.
        const worldId = parseInt(updatedEntity.w, 10);
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
        if (!this.needsUpdate) {
            this.interpolatePredictEntities();
            return;
        }
        let graphics = this.app.engine.graphics;

        let entities = this.entitiesIngame;
        let pushes = this.entitiesOutdated;

        pushes.forEach(
            (updatedEntity, id) =>
            {
                if (this.entitiesLoading.has(id)) return;

                let currentEntity = entities.get(id);
                if (!updatedEntity)
                    this.removeEntity(id, graphics, entities);
                else if (!currentEntity)
                    this.addEntity(id, updatedEntity, graphics, entities);
                else
                    this.updateEntity(id, currentEntity, updatedEntity, graphics, entities);
            }
        );

        this.interpolatePredictEntities();

        // Flush buffer.
        this.entitiesOutdated = new Map();

        // Unset dirty flag.
        this.needsUpdate = false;
    },

    updateEntities(entities)
    {
        if (!entities)
        {
            console.log('Empty update @ server.sub.entities.js');
            return;
        }

        let pushes = this.entitiesOutdated;
        for (let eid in entities) {
            if (!entities.hasOwnProperty(eid)) continue;
            pushes.set(eid, entities[eid]);
        }

        // Set dirty flag.
        this.needsUpdate = true;
    },

    // Catmull interpolation, could come in handy
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

    getTime()
    {
        return window.performance.now();
    },

    cleanup()
    {
        this.entitiesIngame.clear();
        this.entitiesOutdated.clear();
        this.entitiesLoading.clear();
        this.needsUpdate = false;
        // TODO [CLEANUP] graphical component and all meshes
    }

});

export { EntityModel };
