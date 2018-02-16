/**
 * Integration.
 */

import XCollider from '../collision/x';

class RigidBodiesPhase5 {

    static applyIntegration(
        entities, worldId, oxAxis, world,
        xm, objectOrderer, searcher, o)
    {
        entities.forEach(currentEntity => {
            if (!currentEntity) return;
            let oldWorldId = currentEntity.worldId;
            if (oldWorldId !== worldId) return; // TODO [HIGH] make this pas afterwards

            let oi = currentEntity.indexX;
            let entityIndex = currentEntity.entityId;
            let currentObject = oxAxis[oi];
            if (!currentObject || currentObject.kind !== 'e') return;

            // Reset stamped collision.
            currentEntity.lastR = -1;

            // Temporarily discard insulated objects.
            // // if (oxToIslandIndex[oi] !== -1) return;

            //let entityIndex = oxAxis[oi].id;
            //currentEntity = entities[entityIndex];
            let p0 = currentEntity.p0; let p1 = currentEntity.p1;
            let v0 = currentEntity.v0; let v1 = currentEntity.v1;
            let a0 = currentEntity.a0; let a1 = currentEntity.a1;

            // Cast through potential x.
            let xCrossed = XCollider.xCollide(p0, p1, world, xm);
            //if (oldWorldId == -1) {
            //    console.log('Position: ');
            //    console.log(p0);
            //    console.log('->');
            //    console.log(p1);
            //}

            // TODO [CRIT] 1. if free (pyr, terrain) at gate, switch wld, else snap to gate
            // TODO [CRIT] 2. cast from gate to transform(p1)
            // TODO [CRIT] 3. think recursion
            //currentEntity.metaX = xCrossed;
            //let xCrossed = currentEntity.metaX;

            let entityUpdated = false;

            if (xCrossed) {
                let newWorldId = xCrossed.worldId;
                objectOrderer.switchEntityToWorld(currentEntity, newWorldId, p1);

                // Collide with terrain on the other side (no second x crossing enabled)
                // TODO [HIGH] translate [p0, p1] to [x.position, x.transform(p1, newWorldId)]
                //let hasCollidedAfterwards =
                //    TerrainCollider.linearCollide(currentEntity, wm.getWorld(newWorldId), p0, p1, dtr);
                entityUpdated = true;
            }

            if (p0[0] !== p1[0] || p0[1] !== p1[1] || p0[2] !== p1[2]) {
                //console.log('LetsUpdate!');
                //console.log(p0);
                //console.log(p1);
                //console.log(currentEntity.nu);
                currentEntity.p0 = currentEntity.p1;
                if (!xCrossed) {
                    searcher.updateObjectAxis(entityIndex);
                    objectOrderer.moveObject(currentEntity);
                } else {
                    // TODO [HIGH] objectOrderer.switchEntityToWorld(...)
                }
                entityUpdated = true;
            }
            if (v0[0] !== v1[0] || v0[1] !== v1[1] || v0[2] !== v1[2]) {
                currentEntity.v0 = currentEntity.v1;
                entityUpdated = true;
            }
            if (a0[0] !== a1[0] || a0[1] !== a1[1] || a0[2] !== a1[2]) {
                currentEntity.a0 = currentEntity.a1;
                entityUpdated = true;
            }

            if (entityUpdated)
            {
                o.entityUpdated(entityIndex);
            }

            currentEntity.p1 = [p0[0], p0[1], p0[2]];
            currentEntity.v1 = [0, 0, 0];
            currentEntity.a1 = [0, 0, 0];
            // currentEntity.adherence = [!1, !1, !1, !1, !1, !1];
            currentEntity.metaX = 0;
        });
    }

}

export default RigidBodiesPhase5;
