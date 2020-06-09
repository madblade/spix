/**
 * Integration.
 */

import XCollider from '../collision/x';
import TerrainCollider from '../collision/terrain';

class RigidBodiesPhase5
{
    static applyGravityRotation(entity, gravity)
    {
        let rot = entity.rotation;
        if (rot === null) return;
        // Represents self rotation.
        let relPitch = rot[0];
        let relYaw = rot[1];

        // Represents gravity.
        const pi = Math.PI;
        const x = gravity[0];
        const y = gravity[1];
        const z = gravity[2];

        let v1;
        let v2;

        if (y > 0) {
            v1 = Math.atan(-x / y);
        } else if (y < 0) {
            v1 = x < 0 ?
                pi - Math.atan(x / y) : x > 0 ?
                    -pi + Math.atan(-x / y) : /*x === 0 ?*/ pi;
        } else /*if (y === 0)*/ {
            v1 = x < 0 ? pi / 2 : x > 0 ? -pi / 2 : /*x === 0*/ 0;
        }

        if (z < 0) {
            v2 = -Math.atan(Math.sqrt(x * x + y * y) / z);
        } else if (z > 0) {
            v2 = pi - Math.atan(Math.sqrt(x * x + y * y) / z);
        } else /*if (z === 0)*/ {
            v2 = pi / 2;
        }

        let absPitch = v1;
        let absYaw = v2;

        let oldAbsPitch = rot[2];
        let deltaAbsPitch = absPitch - oldAbsPitch;
        if (relPitch !== rot[0] || relYaw !== rot[1] ||
            absPitch !== rot[2] || absYaw !== rot[3])
        {
            let deltaP = absYaw < Math.PI / 4 ? relPitch - deltaAbsPitch :
                absYaw > 3 * Math.PI / 4 ? relPitch + deltaAbsPitch :
                    relPitch;
            entity.rotate(deltaP, relYaw, absPitch, absYaw);
            return true;
        }

        return false;
    }

    static applyIntegration(
        entities, worldId, oxAxis, world,
        xm, objectOrderer, searcher, o, rigidBodiesSolver)
    {
        entities.forEach(currentEntity => {
            if (!currentEntity) return;
            let oldWorldId = currentEntity.worldId;
            if (oldWorldId !== worldId) return;

            let oi = currentEntity.indexX;
            let entityIndex = currentEntity.entityId;
            let currentObject = oxAxis[oi];
            if (!currentObject || currentObject.kind !== 'e') return;

            // Reset stamped collision.
            currentEntity.lastR = -1;

            // Temporarily discard insulated objects.
            // if (oxToIslandIndex[oi] !== -1) return;

            //let entityIndex = oxAxis[oi].id;
            let p0 = currentEntity.p0; let p1 = currentEntity.p1;
            let v0 = currentEntity.v0; let v1 = currentEntity.v1;
            let a0 = currentEntity.a0; let a1 = currentEntity.a1;

            // Cast through potential x.
            let xCrossed = XCollider.xCollide(p0, p1, world, xm);
            // if (oldWorldId == -1) {
            //    console.log(`Position: ${p0} -> ${p1}`);
            // }

            // For cross-w collision one can do the following:
            //  1. if free (pyr, terrain) at gate, switch wld, else snap to gate
            //  2. cast from gate to transform(p1)
            //  3. think recursion
            //currentEntity.metaX = xCrossed;
            //let xCrossed = currentEntity.metaX;

            let entityUpdated = false;

            if (xCrossed)
            {
                let newWorldId = xCrossed.worldId;
                objectOrderer.switchEntityToWorld(currentEntity, newWorldId, p1);

                // To collide with terrain on the other side, do the following:
                // REMEMBER to TRANSLATE [p0, p1] to [x.position, x.transform(p1, newWorldId)]
                // let hasCollidedAfterwards =
                //   TerrainCollider.linearCollide(currentEntity, wm.getWorld(newWorldId), p0, p1, dtr);
                entityUpdated = true;
            }

            if (p0[0] !== p1[0] || p0[1] !== p1[1] || p0[2] !== p1[2])
            {
                currentEntity.p0 = p1;
                currentEntity.p1 = p0;
                if (!xCrossed) {
                    searcher.updateObjectAxis(entityIndex);
                    objectOrderer.moveObject(currentEntity);
                } else {
                    // Here one should call a function objectOrderer.switchEntityToWorld(...)
                }
                entityUpdated = true;
            }

            // Rotate entity
            if (!xCrossed)
            {
                let gravity = rigidBodiesSolver.getGravity(world, worldId, p0[0], p0[1], p0[2]);
                if (RigidBodiesPhase5.applyGravityRotation(currentEntity, gravity)) {
                    entityUpdated = true;
                    const gx = gravity[0]; const gy = gravity[1]; const gz = gravity[2];
                    const gx0 = gx !== 0; const gy0 = gy !== 0; const gz0 = gz !== 0;
                    if (gx0 ^ gy0 ^ gz0) {
                        if (gz0) {
                            currentEntity.widthX = 0.25;
                            currentEntity.widthY = 0.25;
                            currentEntity.widthZ = 0.9;
                        } else if (gx0) {
                            currentEntity.widthX = 0.9;
                            currentEntity.widthY = 0.25;
                            currentEntity.widthZ = 0.25;
                        } else if (gy0) {
                            currentEntity.widthX = 0.25;
                            currentEntity.widthY = 0.9;
                            currentEntity.widthZ = 0.25;
                        }
                    }
                }
            }

            if (v0[0] !== v1[0] || v0[1] !== v1[1] || v0[2] !== v1[2])
            {
                currentEntity.v0 = v1;
                currentEntity.v1 = v0;
                // Velocity updates not visible by clients.
                entityUpdated = true;
            }

            for (let axis = 0; axis < 3; ++axis)
                if (currentEntity.v0[axis] !== 0 && p0[axis] === p1[axis])
                    currentEntity.v0[axis] = 0;

            if (a0[0] !== a1[0] || a0[1] !== a1[1] || a0[2] !== a1[2])
            {
                currentEntity.a0 = a1;
                currentEntity.a1 = a0;
                // Acceleration updates not visible by clients.
                entityUpdated = true;
            }

            if (entityUpdated)
            {
                o.entityUpdated(entityIndex);
            }

            // Swap
            p1 = currentEntity.p1; p0 = currentEntity.p0;
            v1 = currentEntity.v1;
            a1 = currentEntity.a1;
            for (let i = 0; i < 3; ++i)
            {
                p1[i] = p0[i];
                v1[i] = 0;
                a1[i] = 0;
            }
            // To reset adherence:
            // currentEntity.adherence = [!1, !1, !1, !1, !1, !1];
            currentEntity.metaX = 0;
        });
    }

    static collidePair(
        snapper,
        snappee
    )
    {
        const eps = 2 * TerrainCollider.eps;
        // let numClamp = TerrainCollider.numericClamp;
        let abs = Math.abs;
        let pn0 = snapper.p0;
        let p0 = snappee.p0;
        let p1 = snappee.p1;

        const dwx = snappee.widthX + snapper.widthX + eps;
        const endsInX = abs(p1[0] - pn0[0]) < dwx;
        if (!endsInX) return;

        const dwy = snappee.widthY + snapper.widthY + eps;
        const endsInY = abs(p1[1] - pn0[1]) < dwy;
        if (!endsInY) return;

        const dwz = snappee.widthZ + snapper.widthZ + eps;
        const endsInZ = abs(p1[2] - pn0[2]) < dwz;
        if (!endsInZ) return;

        const startsInX = abs(p0[0] - pn0[0]) < dwx;
        const startsInY = abs(p0[1] - pn0[1]) < dwy;
        const startsInZ = abs(p0[2] - pn0[2]) < dwz;

        if (startsInX && startsInY && startsInZ)
        {
            // console.warn('[P5] A collision could not be prevented.');
            return;
        }

        if (!startsInX && endsInX)
        {
            p1[0] = p0[0] < pn0[0] ?
                pn0[0] - dwx - eps :
                pn0[0] + dwx + eps;
            return;
        }
        if (!startsInY && endsInY)
        {
            p1[1] = p0[1] < pn0[1] ?
                pn0[1] - dwy - eps :
                pn0[1] + dwy + eps;
            return;
        }
        if (!startsInZ && endsInZ)
        {
            p1[2] = p0[2] < pn0[2] ?
                pn0[2] - dwz - eps :
                pn0[2] + dwz + eps;
            // return;
        }
    }

    static collideProjectile(
        entity,
        projectile,
        gravity
    )
    {
        if (projectile.collided) return;

        let abs = Math.abs;
        let ep = entity.p0;
        let pp = projectile.p0;
        let px = projectile.p1;

        const dwx = entity.widthX + projectile.widthX;
        let dx = ep[0] - pp[0];
        const endsInX = abs(dx) < dwx;
        if (!endsInX) return;

        const dwy = projectile.widthY + projectile.widthY;
        let dy = ep[1] - pp[1];
        const endsInY = abs(dy) < dwy;
        if (!endsInY) return;

        const dwz = entity.widthZ + projectile.widthZ;
        let dz = ep[2] - pp[2];
        const endsInZ = abs(dz) < dwz;
        if (!endsInZ) return;

        // Normalize and clamp
        dx = px[0] - pp[0];
        dy = px[1] - pp[1];
        dz = px[2] - pp[2];
        const norm = Math.sqrt(dx * dx + dy * dy + dz * dz);
        let fx = dx / norm; fx = Math.max(-1, Math.min(fx, 1));
        let fy = dy / norm; fy = Math.max(-1, Math.min(fy, 1));
        let fz = dz / norm; fz = Math.max(-1, Math.min(fz, 1));

        let slh = entity.sinceLastHit();
        // console.log(slh);
        const strength = 0.5;
        const nx = abs(gravity[0]) > 0 ? slh > 40 ?
            -35 * gravity[0] : 0 : strength * fx;
        const ny = abs(gravity[1]) > 0 ? slh > 40 ?
            -35 * gravity[1] : 0 : strength * fy;
        const nz = abs(gravity[2]) > 0 ? slh > 40 ?
            -35 * gravity[2] : 0 : strength * fz;
        entity.setHitVector(nx, ny, nz);
        entity.hit = true;
        if (slh > 40) entity.wasHit();
        projectile.collided = true;
    }

    static collideMelee(
        hitter,
        hittee,
        gravity
    )
    {
        let o = hitter.p0;
        let d = hittee.p0;
        let abs = Math.abs;
        const meleeRange = 2 * 0.9;

        // Detect hit
        const dwx = hittee.widthX + meleeRange;
        const dx = d[0] - o[0];
        const inX = abs(dx) < dwx;
        if (!inX) return;

        const dwy = hittee.widthY + meleeRange;
        const dy = d[1] - o[1];
        const inY = abs(dy) < dwy;
        if (!inY) return;

        const dwz = hittee.widthZ + meleeRange;
        const dz = d[2] - o[2];
        const inZ = abs(dz) < dwz;
        if (!inZ) return;

        // Perform hit.
        const norm = Math.sqrt(dx * dx + dy * dy + dz * dz);
        let x = dx / norm; x = Math.max(-1, Math.min(x, 1));
        let y = dy / norm; y = Math.max(-1, Math.min(y, 1));
        let z = dz / norm; z = Math.max(-1, Math.min(z, 1));
        const forwardVector = hitter.getForwardActionVector();
        const fx = forwardVector[0];
        const fy = forwardVector[1];
        const fz = forwardVector[2];
        const dotProduct = fx * x + fy * y + fz * z;
        if (dotProduct > 0.7)
        {
            // console.log('melee hit');
            const strength = 0.5;
            if (!hittee.isParrying)
            {
                let slh = hittee.sinceLastHit();
                // console.log(slh);
                const nx = abs(gravity[0]) > 0 ? slh > 40 ?
                    -35 * gravity[0] : 0 : strength * fx;
                const ny = abs(gravity[1]) > 0 ? slh > 40 ?
                    -35 * gravity[1] : 0 : strength * fy;
                const nz = abs(gravity[2]) > 0 ? slh > 40 ?
                    -35 * gravity[2] : 0 : strength * fz;

                hittee.setHitVector(nx, ny, nz);
                // console.log(hittee.hitVector);
                hittee.hit = true;
                if (slh > 40) hittee.wasHit();
            }
            else
            {
                let of = hittee.getForwardActionVector();
                const dot2 = of[0] * fx + of[1] * fy + of[2] * fz;
                if (dot2 < 0.7)
                {
                    let slh = hittee.sinceLastHit();
                    hittee.setHitVector(
                        abs(gravity[0]) > 0 ? slh > 40 ?
                            -35 * gravity[0] : 0 : strength * fx,
                        abs(gravity[1]) > 0 ? slh > 40 ?
                            -35 * gravity[1] : 0 : strength * fy,
                        abs(gravity[2]) > 0 ? slh > 40 ?
                            -35 * gravity[2] : 0 : strength * fz
                    );
                    hittee.hit = true;
                    if (slh > 40) hittee.wasHit();
                }
            }
        }
    }

    static simpleCollideIntegrate(
        entities, worldId, oxAxis, world,
        xm, objectOrderer, searcher, o, rigidBodiesSolver
    )
    {
        const eps = TerrainCollider.eps;
        entities.forEach(currentEntity => {
            if (!currentEntity) return;
            if (currentEntity._isProjectile)
                currentEntity.ageProjectile();
            else
                currentEntity.countSinceLastHit();

            let oldWorldId = currentEntity.worldId;
            if (oldWorldId !== worldId) return;

            let oi = currentEntity.indexX;
            let entityIndex = currentEntity.entityId;
            let currentObject = oxAxis[oi];
            if (!currentObject || currentObject.kind !== 'e') return;

            // Reset stamped collision.
            currentEntity.lastR = -1;

            // Temporarily discard insulated objects.
            // if (oxToIslandIndex[oi] !== -1) return;

            //let entityIndex = oxAxis[oi].id;
            let p0 = currentEntity.p0; let p1 = currentEntity.p1;
            let v0 = currentEntity.v0; let v1 = currentEntity.v1;
            let a0 = currentEntity.a0; let a1 = currentEntity.a1;

            // Cast through potential x.
            let xCrossed = XCollider.xCollide(p0, p1, world, xm);
            // if (oldWorldId == -1) {
            //    console.log(`Position: ${p0} -> ${p1}`);
            // }

            // For cross-w collision one can do the following:
            //  1. if free (pyr, terrain) at gate, switch wld, else snap to gate
            //  2. cast from gate to transform(p1)
            //  3. think recursion
            //currentEntity.metaX = xCrossed;
            //let xCrossed = currentEntity.metaX;

            let entityUpdated = false;

            if (xCrossed)
            {
                let newWorldId = xCrossed.worldId;
                objectOrderer.switchEntityToWorld(currentEntity, newWorldId, p1);

                // To collide with terrain on the other side, do the following:
                // REMEMBER to TRANSLATE [p0, p1] to [x.position, x.transform(p1, newWorldId)]
                // let hasCollidedAfterwards =
                //   TerrainCollider.linearCollide(currentEntity, wm.getWorld(newWorldId), p0, p1, dtr);
                entityUpdated = true;
            }

            const hasMeleed = currentEntity.hasJustMeleed;
            const hasMoved = p0[0] !== p1[0] || p0[1] !== p1[1] || p0[2] !== p1[2];
            if (hasMeleed || hasMoved)
            {
                let gravity = rigidBodiesSolver.getGravity(world, worldId, p0[0], p0[1], p0[2]);
                const isProjectile = currentEntity._isProjectile;
                const rangeCollision = currentEntity.widthX + 2 * eps;
                const rangeMelee = 2 * 0.9;

                // Detect collision and collide.
                let oii;
                for (oii = oi + 1; oii < oxAxis.length; ++oii) // Right
                {
                    let nid = oxAxis[oii].id;
                    let n = entities[nid];
                    const isOtherEntityProjectile = n._isProjectile;
                    if (isProjectile && currentEntity.collided) break;
                    if (
                        isProjectile && isOtherEntityProjectile ||
                        isOtherEntityProjectile && n.collided
                    )
                        continue;

                    const dx = Math.abs(n.p0[0] - p1[0]);
                    const outCollisionRange = dx > n.widthX + rangeCollision;
                    if (!hasMeleed && outCollisionRange)
                        break;
                    if (hasMoved && !outCollisionRange)
                    {
                        if (!isProjectile && !isOtherEntityProjectile)
                            RigidBodiesPhase5.collidePair(n, currentEntity);
                        else
                        {
                            RigidBodiesPhase5.collideProjectile(
                                isProjectile ? n : currentEntity,
                                isProjectile ? currentEntity : n,
                                gravity
                            );
                        }
                    }
                    if (hasMeleed)
                    {
                        const outMeleeRange = dx > n.widthX + rangeMelee;
                        if (outMeleeRange && outCollisionRange) break;
                        RigidBodiesPhase5.collideMelee(currentEntity, n, gravity);
                    }
                }
                for (oii = oi - 1; oii >= 0; --oii) // Left
                {
                    let nid = oxAxis[oii].id;
                    let n = entities[nid];
                    const isOtherEntityProjectile = n._isProjectile;
                    if (isProjectile && currentEntity.collided) break;
                    if (
                        isProjectile && isOtherEntityProjectile ||
                        isOtherEntityProjectile && n.collided
                    )
                        continue;

                    const dx = Math.abs(n.p0[0] - p1[0]);
                    const outCollisionRange = dx > n.widthX + rangeCollision;
                    if (!hasMeleed && outCollisionRange)
                        break;
                    if (hasMoved && !outCollisionRange)
                    {
                        if (!isProjectile && !isOtherEntityProjectile)
                            RigidBodiesPhase5.collidePair(n, currentEntity);
                        else
                        {
                            RigidBodiesPhase5.collideProjectile(
                                isProjectile ? n : currentEntity,
                                isProjectile ? currentEntity : n,
                                gravity
                            );
                        }
                    }
                    if (hasMeleed)
                    {
                        const outMeleeRange = dx > n.widthX + rangeMelee;
                        if (outMeleeRange && outCollisionRange) break;
                        RigidBodiesPhase5.collideMelee(currentEntity, n, gravity);
                    }
                }

                currentEntity.hasJustMeleed = false;
            }

            if (p0[0] !== p1[0] || p0[1] !== p1[1] || p0[2] !== p1[2])
            {
                currentEntity.p0 = p1;
                currentEntity.p1 = p0;
                if (!xCrossed) {
                    searcher.updateObjectAxis(entityIndex);
                    objectOrderer.moveObject(currentEntity);
                } else {
                    // Here one should call a function objectOrderer.switchEntityToWorld(...)
                }
                entityUpdated = true;

                if (currentEntity._isProjectile)
                    currentEntity.hasMoved();
            }

            // Rotate entity
            if (!xCrossed)
            {
                let gravity = rigidBodiesSolver.getGravity(world, worldId, p0[0], p0[1], p0[2]);
                if (RigidBodiesPhase5.applyGravityRotation(currentEntity, gravity)) {
                    entityUpdated = true;
                    const gx = gravity[0]; const gy = gravity[1]; const gz = gravity[2];
                    const gx0 = gx !== 0; const gy0 = gy !== 0; const gz0 = gz !== 0;
                    if (gx0 ^ gy0 ^ gz0) {
                        if (gz0) {
                            currentEntity.widthX = 0.25;
                            currentEntity.widthY = 0.25;
                            currentEntity.widthZ = 0.9;
                        } else if (gx0) {
                            currentEntity.widthX = 0.9;
                            currentEntity.widthY = 0.25;
                            currentEntity.widthZ = 0.25;
                        } else if (gy0) {
                            currentEntity.widthX = 0.25;
                            currentEntity.widthY = 0.9;
                            currentEntity.widthZ = 0.25;
                        }
                    }
                }
            }

            if (v0[0] !== v1[0] || v0[1] !== v1[1] || v0[2] !== v1[2])
            {
                currentEntity.v0 = v1;
                currentEntity.v1 = v0;
                // Velocity updates not visible by clients.
                entityUpdated = true;
            }

            for (let axis = 0; axis < 3; ++axis)
                if (currentEntity.v0[axis] !== 0 && p0[axis] === p1[axis])
                    currentEntity.v0[axis] = 0;

            if (a0[0] !== a1[0] || a0[1] !== a1[1] || a0[2] !== a1[2])
            {
                currentEntity.a0 = a1;
                currentEntity.a1 = a0;
                // Acceleration updates not visible by clients.
                entityUpdated = true;
            }

            if (entityUpdated)
            {
                o.entityUpdated(entityIndex);
            }

            // Swap
            p1 = currentEntity.p1; p0 = currentEntity.p0;
            v1 = currentEntity.v1;
            a1 = currentEntity.a1;
            for (let i = 0; i < 3; ++i)
            {
                p1[i] = p0[i];
                v1[i] = 0;
                a1[i] = 0;
            }
            // To reset adherence:
            // currentEntity.adherence = [!1, !1, !1, !1, !1, !1];
            currentEntity.metaX = 0;
            if (currentEntity._isProjectile)
            {
                if (currentEntity.collided ||
                    currentEntity.howLongSinceLastMoved() > 180)
                {
                    rigidBodiesSolver
                        ._physicsEngine._ai
                        .pushProjectileForDespawn(currentEntity.entityId);
                }
            }
        });
    }
}

export default RigidBodiesPhase5;
