/**
 *
 */

'use strict';

class TerrainCollider {

    /**
     * @returns 'has collided'
     */
    static linearCollide(entity, WM, position, newPosition) {

        // Intersect on first Non-Free Block
        if (TerrainCollider.intersectAmanditesWoo(position, newPosition, WM, entity,
            (WM, entity,                 // objects
                i, j, k,                    // next voxel coordinates
                tMaxX, tMaxY, tMaxZ,        // current value of t at which p1p2 crosses (x,y,z) orth. comp.
                tDeltaX, tDeltaY, tDeltaZ,  // delta between crosses on orth. comp.
                dx, dy, dz,                 // orth. directions of p1p2
                x1, y1, z1,                 // starting point
                x2, y2, z2,                 // ending point
                ntx, nty, ntz               // last orth. to be updated (current shift coordinate)
            ) => {

            if (WM.isFree([i, j, k])) return false;

            // Collision
            // Damping on first encountered NFB (collision later on)

            const tol = .001;
            if (ntx) {
                const t = tMaxX-tDeltaX-tol;
                const nx = dx > 0 ? i-tol : i+1+tol;
                const ddx = dx < 0 ? 1 : -1;

                // Projections
                let ny = y1+(y2-y1);
                let nyt = y1+(y2-y1)*t;
                let dby = Math.abs(Math.floor(ny)-Math.floor(nyt));
                if (dby < 2) {
                    if (dy < 0 && (dby < 1 || WM.isFree([i+ddx, j-1, k]))) { nyt = ny; }
                    if (dy > 0 && (dby < 1 || WM.isFree([i+ddx, j+1, k]))) { nyt = ny; }
                }

                let nz = z1+(z2-z1);
                let nzt = z1+(z2-z1)*t;
                let dbz = Math.abs(Math.floor(nz)-Math.floor(nzt));
                if (dbz < 2) {
                    if (dz < 0 && (dbz < 1 || WM.isFree([i, j, k-1]))) { nzt = nz; }
                    if (dz > 0 && (dbz < 1 || WM.isFree([i, j, k+1]))) { nzt = nz; }
                }

                // entity.speed = entity._impulseSpeed;
                entity.position = [nx, nyt, nzt];

            } else if (nty) {
                const t = tMaxY-tDeltaY-tol;
                const ny = dy > 0 ? j-tol : j+1+tol;
                const ddy = dy < 0 ? 1 : -1;

                let nx = x1+(x2-x1);
                let nxt = x1+(x2-x1)*t;
                let dbx = Math.abs(Math.floor(nx)-Math.floor(nxt));
                if (dbx < 2) {
                    if (dx < 0 && (dbx < 1 || WM.isFree([i-1, j+ddy, k]))) { nxt = nx; }
                    if (dx > 0 && (dbx < 1 || WM.isFree([i+1, j+ddy, k]))) { nxt = nx; }
                }

                let nz = z1+(z2-z1);
                let nzt = z1+(z2-z1)*t;
                let dbz = Math.abs(Math.floor(nz)-Math.floor(nzt));
                if (dbz < 2) {
                    if (dz < 0 && (dbz < 1 || WM.isFree([i, j+ddy, k-1]))) { nzt = nz; }
                    if (dz > 0 && (dbz < 1 || WM.isFree([i, j+ddy, k+1]))) { nzt = nz; }
                }

                // entity.speed = entity._impulseSpeed;
                entity.position = [nxt, ny, nzt];

            } else if (ntz) {
                const t = tMaxZ-tDeltaZ-tol;
                const nz = dz > 0 ? k-tol : k+1+tol;
                const ddz = dz < 0 ? 1 : -1;

                let nx = x1+(x2-x1);
                let nxt = x1+(x2-x1)*t;
                let dbx = Math.abs(Math.floor(nx)-Math.floor(nxt));
                if (dbx < 2) {
                    if (dx < 0 && (dbx < 1 || WM.isFree([i-1, j, k+ddz]))) { nxt = nx; }
                    if (dx > 0 && (dbx < 1 || WM.isFree([i+1, j, k+ddz]))) { nxt = nx; }
                }

                let ny = y1+(y2-y1);
                let nyt = y1+(y2-y1)*t;
                let dby = Math.abs(Math.floor(ny)-Math.floor(nyt));
                if (dby < 2) {
                    if (dy < 0 && (dby < 1 || WM.isFree([i, j-1, k+ddz]))) { nyt = ny; }
                    if (dy > 0 && (dby < 1 || WM.isFree([i, j+1, k+ddz]))) { nyt = ny; }
                }

                entity.adherence = true;
                entity.speed = entity._impulseSpeed;
                entity.position = [nxt, nyt, nz];

            }

            // Bounce
            // entity.speed[2] = -(entity.speed[2]-entity._impulseSpeed[2]);
            entity.acceleration = [0, 0, 0]; // Use Euler with collisions

            return true;

        })) return true;

        // Update entity position.
        entity.position = newPosition;
        return false;
    }

    static intersectAmanditesWoo(p1, p2, WM, entity, callback) {

        let sgn = x => (x > 0 ? 1 : (x < 0 ? -1 : 0));
        let frac0 = x => x - Math.floor(x);
        let frac1 = x => 1.0 - x + Math.floor(x);
        let min = (x, y) => Math.min(x, y);

        let x1 = p1[0]; let x2 = p2[0];
        let y1 = p1[1]; let y2 = p2[1];
        let z1 = p1[2]; let z2 = p2[2];

        // p1p2 is parametrized as p(t) = p1 + (p2-p1)*t
        // tDeltaX def. how far one has to move, in units of t, s. t. the horiz. comp. of the mvt. eq. the wdth. of a v.
        // tMaxX def. the value of t at which (p1p2) crosses the first (then nth) vertical boundary.
        let tMaxX, tMaxY, tMaxZ,
            tDeltaX, tDeltaY, tDeltaZ;
        let ntx = false, nty = false, ntz = false;

        const threshold = 10000000.0;

        let dx = sgn(x2-x1);
        let i = Math.floor(x1);
        if (dx != 0) tDeltaX = min(dx / (x2 - x1), threshold); else tDeltaX = threshold;
        if (dx > 0) tMaxX = tDeltaX * frac1(x1); else tMaxX = tDeltaX * frac0(x1);

        let dy = sgn(y2-y1);
        let j = Math.floor(y1);
        if (dy != 0) tDeltaY = min(dy / (y2 - y1), threshold); else tDeltaY = threshold;
        if (dy > 0) tMaxY = tDeltaY * frac1(y1); else tMaxY = tDeltaY * frac0(y1);

        let dz = sgn(z2-z1);
        let k = Math.floor(z1);
        if (dz != 0) tDeltaZ = min(dz / (z2 - z1), threshold); else tDeltaZ = threshold;
        if (dz > 0) tMaxZ = tDeltaZ * frac1(z1); else tMaxZ = tDeltaZ * frac0(z1);

        while (tMaxX <= 1 || tMaxY <= 1 || tMaxZ <= 1) {
            if (tMaxX < tMaxY) {
                if (tMaxX < tMaxZ) {
                    i += dx;
                    tMaxX += tDeltaX;
                    ntx = true; nty = false; ntz = false;
                } else {
                    k += dz;
                    tMaxZ += tDeltaZ;
                    ntx = false; nty = false; ntz = true;
                }
            } else {
                if (tMaxY < tMaxZ) {
                    j += dy;
                    tMaxY += tDeltaY;
                    ntx = false; nty = true; ntz = false;
                } else {
                    k += dz;
                    tMaxZ += tDeltaZ;
                    ntx = false; nty = false; ntz = true;
                }
            }

            if (callback(
                WM, entity,                 // objects
                i, j, k,                    // next voxel coordinates
                tMaxX, tMaxY, tMaxZ,        // current value of t at which p1p2 crosses (x,y,z) orth. comp.
                tDeltaX, tDeltaY, tDeltaZ,  // delta between crosses on orth. comp.
                dx, dy, dz,                 // orth. directions of p1p2
                x1, y1, z1,                 // starting point
                x2, y2, z2,                 // ending point
                ntx, nty, ntz               // last orth. to be updated (current shift coordinate)
            )) return true;

        }

        // No collision
        return false;
    }

}

export default TerrainCollider;
