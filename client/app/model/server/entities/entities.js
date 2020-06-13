/**
 *
 */

'use strict';

import extend           from '../../../extend.js';

import { PlayerModule } from './player.js';
import { Vector3 } from 'three';

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
        let v = new Vector3();
        entity.interpolatingP.set(px, py, pz);
        entity.interpolatingR.set(rx, ry, rz);
        this.updateGraphicalEntity(entity, entity.interpolatingP, entity.interpolatingR, v);
    },

    updateGraphicalEntity(currentEntity, newP, newR) //, oldP)
    {
        // Update positions and rotation
        let object3D = currentEntity.getObject3D();
        let graphics = this.app.engine.graphics;

        let p = object3D.position;
        let animate = p.x !== newP.x || p.y !== newP.y;
        // XXX [ANIMATION] link animation in 3D case
        if (currentEntity.isProjectile)
        {
            const dx = newP.x - p.x;
            const dy = newP.y - p.y;
            const dz = newP.z - p.z;
            let v1;
            let v2;
            const pi = Math.PI;
            const dxxdyy = dx * dx + dy * dy;
            if (dxxdyy + dz * dz < 1e-12)
            {
                const selfRotation = this.app.model.server.selfModel.rotation;
                v1 = selfRotation[2];
                v2 = selfRotation[3];
                let rr = currentEntity.currentRFromServer;
                object3D.rotation.x = Math.PI + rr[3]; // newR.z; // ur[3];
                object3D.rotation.z = rr[2]; // newR.y; // ur[2];
                // object3D.getWrapper().rotation.y = selfRotation[0];
            }
            else
            {
                if (dy > 0) {
                    v1 = Math.atan(-dx / dy);
                } else if (dy < 0) {
                    v1 = dx < 0 ?
                        pi - Math.atan(dx / dy) : dx > 0 ?
                            -pi + Math.atan(-dx / dy) : /*x === 0 ?*/ pi;
                } else /*if (y === 0)*/ {
                    v1 = dx < 0 ? pi / 2 : dx > 0 ? -pi / 2 : /*x === 0*/ 0;
                }

                if (dz < 0) {
                    v2 = -Math.atan(Math.sqrt(dxxdyy) / dz);
                } else if (dz > 0) {
                    v2 = pi - Math.atan(Math.sqrt(dxxdyy) / dz);
                } else /*if (z === 0)*/ {
                    v2 = pi / 2;
                }
                // this.newRot = Date.now();
                // this.elapsed  = this.newRot - (this.lastRot || 0);
                // this.lastRot = this.newRot;
                // console.log(this.elapsed);

                object3D.rotation.x = Math.PI + v2; // newR.z; // ur[3];
                object3D.rotation.z = v1; // newR.y; // ur[2];
                //object3D.getWrapper().rotation.y = Math.PI + newR.x; // + ur[0];
                if (!currentEntity.inScene)
                {
                    currentEntity.inScene = true;
                    graphics.addToScene(object3D, currentEntity.getWorldId());
                }
                let helper = currentEntity.getHelper();
                if (helper && helper.geometry)
                {
                    let positions = helper.geometry.attributes.position.array;
                    const MAX_POINTS = positions.length / 3;
                    let drawRange = helper.geometry.drawRange.count;
                    let index = 3 * drawRange;
                    if (drawRange < MAX_POINTS)
                    {
                        positions[index++] = newP.x;
                        positions[index++] = newP.y;
                        positions[index++] = newP.z;
                        helper.computeLineDistances();
                        helper.geometry.setDrawRange(0, drawRange + 1);
                        helper.geometry.attributes.position.needsUpdate = true;
                        helper.geometry.computeBoundingSphere();
                        // console.log(helper.geometry.attributes.position.array);
                    }
                    else
                    {
                        index = 0;
                        for (let i = 0; i < MAX_POINTS - 1; ++i)
                        {
                            positions[index]     = positions[index + 3];
                            positions[index + 1] = positions[index + 4];
                            positions[index + 2] = positions[index + 5];
                            index += 3;
                        }
                        positions[index] = newP.x;
                        positions[index + 1] = newP.y;
                        positions[index + 2] = newP.z;

                        helper.computeLineDistances();
                        helper.geometry.setDrawRange(0, drawRange + 1);
                        helper.geometry.attributes.position.needsUpdate = true;
                        helper.geometry.computeBoundingSphere();
                    }
                }
            }

            object3D.updateMatrixWorld();
        }
        else
        {
            object3D.rotation.x = newR.z; // ur[3];
            object3D.rotation.z = newR.y; // ur[2];
            object3D.getWrapper().rotation.y = Math.PI + newR.x; // + ur[0];
            object3D.updateMatrixWorld();
        }
        p.copy(newP);


        // Update animation
        const id = currentEntity.id;
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

            case 'projectile':
                this.loadArrow(id, updatedEntity, graphics, entities);
                break;
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
            const wid = entity.getWorldId();
            graphics.removeFromScene(entity.getObject3D(), wid);
            if (entity.helper)
            {
                graphics.removeFromScene(entity.getHelper(), wid);
            }
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
        const oldWorldId = currentEntity.getWorldId();
        if (oldWorldId !== worldId) {
            graphics.removeFromScene(currentEntity.getObject3D(), oldWorldId, true);
            currentEntity.setWorldId(worldId);
            graphics.addToScene(currentEntity.getObject3D(), worldId);

            let helper = currentEntity.getHelper();
            if (helper)
            {
                graphics.removeFromScene(helper, oldWorldId, true);
                graphics.addToScene(helper, worldId);
                console.log(helper);
            }
        }

        // Update current "live" entities.
        entities.set(id, currentEntity);

        if (updatedEntity.d)
        {
            let hasJustMeleed = updatedEntity.d[1];
            if (hasJustMeleed)
            {
                console.log('Someone meleed.');
            }
            // console.log(updatedEntity.d);
        }
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
        // XXX [CLEANUP] graphical component and all meshes
    }

});

export { EntityModel };
