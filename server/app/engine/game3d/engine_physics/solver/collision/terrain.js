/**
 *
 */

'use strict';

class TerrainCollider {

    static eps = .00001;
    
    /**
     * Network casting: 
     * 1. Define a 2D network of 1-spaced points on the entity's 3 forward-moving faces.
     * 2. Parallel cast from seeds using Amandites-Woo's algorithm.
     * 3. Crop to nearest resulting positions.
     * 
     * I know (highly suspect) it can be done way more efficiently.
     * The first thing to optimise is the BSP lookup phase: world.isFree([x, y, z]).
     * Some suggestions:
     * - TODO [OPT] flag empty chunks
     * - TODO [OPT] fast integer chunk lookup
     * - TODO [OPT] chunk caching
     * Think of using octrees if scaling up chunks is an option (might depend on network requirements).
     * 
     * @returns 'has collided'
     */
    static linearCollide(entity, world, position, newPosition, dt) {

        let p0 = position;
        let p1 = newPosition;
        let x0 = p0[0], y0 = p0[1], z0 = p0[2];
        let x1 = p1[0], y1 = p1[1], z1 = p1[2];
        let xW = entity.widthX, 
            yW = entity.widthY,
            zW = entity.widthZ;
        
        let cropX = x1, cropY = y1, cropZ = z1;
        let epsilon = TerrainCollider.eps;
        
        if (x0 !== x1) {
            let xNetwork = [];
            let xArrival = [];
            for (let currentY = y0-yW, lastY = y0+yW;;) {
                for (let currentZ = z0-zW, lastZ = z0+zW;;) {
                    xNetwork.push([x1 < x0 ? x0-xW : x0+xW, currentY, currentZ]);
                    xArrival.push([x1 < x0 ? x1-xW : x1+xW, y1+currentY-y0, z1+currentZ-z0]);
                    if (currentZ >= lastZ) break;
                    currentZ = (currentZ+1) > lastZ ? lastZ : currentZ+1;
                }                
                if (currentY >= lastY) break;
                currentY = (currentY+1) > lastY ? lastY : currentY+1;
            }
            
            // Do intersect.
            for (let i = 0; i < xNetwork.length; ++i) {
                let newCrops = xArrival[i];
                let net = xNetwork[i];
                let c = TerrainCollider.intersectAmanditesWoo(net, newCrops, world, entity);
                if (c) {
                    if (x1 > x0 && newCrops[0]-xW < cropX-epsilon) {
                        cropX = newCrops[0]-xW;
                        cropY = newCrops[1]+y0-net[1];
                        cropZ = newCrops[2]+z0-net[2];
                    }
                    else if (x1 < x0 && newCrops[0]+xW > cropX+epsilon) {
                        cropX = newCrops[0]+xW;
                        cropY = newCrops[1]+y0-net[1];
                        cropZ = newCrops[2]+z0-net[2];
                    }
                }
            }
        }
        
        if (y0 !== y1) {
            let yNetwork = [];
            let yArrival = [];
            for (let currentX = x0-xW, lastX = x0+xW;;) {
                for (let currentZ = z0-zW, lastZ = z0+zW;;) {
                    yNetwork.push([currentX, y1 < y0 ? y0-yW : y0+yW, currentZ]);
                    yArrival.push([x1+currentX-x0, y1 < y0 ? y1-yW : y1+yW, z1+currentZ-z0]);
                    if (currentZ >= lastZ) break;
                    currentZ = (currentZ+1) > lastZ ? lastZ : currentZ+1;
                }
                if (currentX >= lastX) break;
                currentX = (currentX+1) > lastX ? lastX : currentX+1;
            }
            // Do intersect.
            for (let i = 0; i < yNetwork.length; ++i) {
                let newCrops = yArrival[i];
                let net = yNetwork[i];
                let c = TerrainCollider.intersectAmanditesWoo(net, newCrops, world, entity);

                if (c) {
                    if (y1 > y0 && newCrops[1]-yW < cropY-epsilon) {
                        let nx = newCrops[0]+x0-net[0];
                        let ny = newCrops[1]-yW;
                        let nz = newCrops[2]+z0-net[2];
                        if ((x1 < x0 && x1 < nx && cropX < nx) || (x0 < x1 && nx < x1 && nx < cropX) || x0 === x1)
                            cropX = nx;
                        cropY = ny;
                        if ((z1 < z0 && z1 < nz && cropZ < nz) || (z0 < z1 && nz < z1 && nz < cropZ) || z0 === z1)
                            cropZ = nz;
                    }
                    else if (y1 < y0 && newCrops[1]+yW > cropY+epsilon) {
                        let nx = newCrops[0]+x0-net[0];
                        let ny = newCrops[1]+yW;
                        let nz = newCrops[2]+z0-net[2];
                        if ((x1 < x0 && x1 < nx && cropX < nx) || (x0 < x1 && nx < x1 && nx < cropX) || x0 === x1)
                            cropX = nx;
                        cropY = ny;
                        if ((z1 < z0 && z1 < nz && cropZ < nz) || (z0 < z1 && nz < z1 && nz < cropZ) || z0 === z1)
                            cropZ = nz;
                    }
                }
            }
        }
        
        if (z0 !== z1) {
            let zNetwork = [];
            let zArrival = [];
            for (let currentX = x0-xW, lastX = x0+xW;;) {
                for (let currentY = y0-yW, lastY = y0+yW;;) {
                    zNetwork.push([currentX, currentY, z1 < z0 ? z0-zW+epsilon : z0+zW]);
                    zArrival.push([x1+currentX-x0, y1+currentY-y0, z1 < z0 ? z1-zW : z1+zW]);
                    if (currentY >= lastY) break;
                    currentY = (currentY+1) > lastY ? lastY : currentY+1;
                }
                if (currentX >= lastX) break;
                currentX = (currentX+1) > lastX ? lastX : currentX+1;
            }
            
            // Do intersect.
            for (let i = 0; i < zNetwork.length; ++i) {
                let newCrops = zArrival[i];
                let net = zNetwork[i];
                let c = TerrainCollider.intersectAmanditesWoo(net, newCrops, world, entity);
                if (c) {
                    if (z1 > z0 && newCrops[2]-zW < cropZ-epsilon) {
                        let nx = newCrops[0]+x0-net[0];
                        let ny = newCrops[1]+y0-net[1];
                        let nz = newCrops[2]-zW;
                        if ((x1 < x0 && x1 < nx && cropX < nx) || (x0 < x1 && nx < x1 && nx < cropX) || x0 === x1)
                            cropX = nx;
                        if ((y1 < y0 && y1 < ny && cropY < ny) || (y0 < y1 && ny < y1 && ny < cropY) || y0 === y1)
                            cropY = ny;
                        cropZ = nz;
                    }
                    else if (z1 < z0 && newCrops[2]+zW > cropZ+epsilon) {
                        let nx = newCrops[0]+x0-net[0];
                        let ny = newCrops[1]+y0-net[1];
                        let nz = newCrops[2]+zW;
                        if ((x1 < x0 && x1 < nx && cropX < nx) || (x0 < x1 && nx < x1 && nx < cropX) || x0 === x1)
                            cropX = nx;
                        if ((y1 < y0 && y1 < ny && cropY < ny) || (y0 < y1 && ny < y1 && ny < cropY) || y0 === y1)
                            cropY = ny;
                        cropZ = nz;
                    }
                    
                }
            }
        }
        
        if (cropX !== x1 || cropY !== y1 || cropZ !== z1) {
            newPosition[0] = cropX;
            newPosition[1] = cropY;
            newPosition[2] = cropZ;
            return true;
        }
        
        // Intersect on first Non-Free Block
        // if (TerrainCollider.intersectAmanditesWoo(position, newPosition, world, entity)) return true;

        // Update entity position.
        //entity.position = newPosition;
        let ep1 = entity.p1;
        let ep0 = entity.p0;
        let adh = entity.adherence;
        
        for (let i = 0; i < 3; ++i) {
            if (adh[i] && newPosition[i] !== ep0[i]) adh[i] = false;
            if (adh[3+i] && newPosition[i] !== ep0[i]) adh[3+i] = false;

            //ep1[i] = newPosition[i];
            //entity.adherence[ii] = false;
            //entity.adherence[ii+3] = false;
        }

        return false;
    }

    static intersectAmanditesWoo(p1, p2, world, entity) {

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

            if (TerrainCollider.simpleCollide(
                world, entity,                 // objects
                i, j, k,                    // next voxel coordinates
                tMaxX, tMaxY, tMaxZ,        // current value of t at which p1p2 crosses (x,y,z) orth. comp.
                tDeltaX, tDeltaY, tDeltaZ,  // delta between crosses on orth. comp.
                dx, dy, dz,                 // orth. directions of p1p2
                x1, y1, z1,                 // starting point
                x2, y2, z2,                 // ending point
                ntx, nty, ntz,              // last orth. to be updated (current shift coordinate)
                p2 // Crop arrival position.
            )) return true;

        }

        // No collision
        return false;
    }

    static simpleCollide(world, entity,                 // objects
                        i, j, k,                    // next voxel coordinates
                        tMaxX, tMaxY, tMaxZ,        // current value of t at which p1p2 crosses (x,y,z) orth. comp.
                        tDeltaX, tDeltaY, tDeltaZ,  // delta between crosses on orth. comp.
                        dx, dy, dz,                 // orth. directions of p1p2
                        x1, y1, z1,                 // starting point
                        x2, y2, z2,                 // ending point
                        ntx, nty, ntz,              // last orth. to be updated (current shift coordinate)
                        newPosition)    // position to be cropped to
        {

        if (world.isFree([i, j, k])) return false;

        // Collision
        // Damping on first encountered NFB (collision later on)

        const tol = TerrainCollider.eps; // .00001;
        const nx0 = dx > 0 ? i-tol : i+1+tol;
        const ny0 = dy > 0 ? j-tol : j+1+tol;
        const nz0 = dz > 0 ? k-tol : k+1+tol;
        // let newPosition = [0, 0, 0];
        let oldAdherence = [false, false, false, false, false, false];
        let adherence = entity.adherence;
        for (let ii = 0; ii<6; ++ii) { oldAdherence[ii] = adherence[ii]; }

        if (ntx) {
            const t = tMaxX-tDeltaX;
            const ddx = dx < 0 ? 1 : -1;

            // Projections
            let ny = y1+(y2-y1);
            let nyt = y1+(y2-y1)*t;
            let dby = Math.abs(Math.floor(ny)-Math.floor(nyt));
            if (dby < 2) {
                if (dy < 0) {
                    const free = world.isFree([i+ddx, j-1, k]);
                    if ((!free && dby < 1 && ny > ny0-1) || free) { nyt = ny; adherence[1] = false; }
                    else { nyt = ny0-1; if (dby > 0 && !free) adherence[1] = true; }
                }
                if (dy > 0) {
                    const free = world.isFree([i+ddx, j+1, k]);
                    if ((!free && dby < 1 && ny < ny0+1) || free) { nyt = ny; adherence[4] = false; }
                    else { nyt = ny0+1; if (dby > 0 && !free) adherence[4] = true; }
                }
            }

            let nz = z1+(z2-z1);
            let nzt = z1+(z2-z1)*t;
            let dbz = Math.abs(Math.floor(nz)-Math.floor(nzt));
            if (dbz < 2) {
                if (dz < 0) {
                    const free = world.isFree([i+ddx, j, k-1]);
                    if ((!free && dbz < 1 && nz > nz0-1) || free) { nzt = nz; adherence[2] = false; }
                    else { nzt = nz0-1; if (dbz > 0 && !free) adherence[2] = true; }
                }
                if (dz > 0) {
                    const free = world.isFree([i+ddx, j, k+1]);
                    if ((!free && dbz < 1 && nz < nz0+1) || free) { nzt = nz; adherence[5] = false; }
                    else { nzt = nz0+1; if (dbz > 0 && !free) adherence[5] = true; }
                }
            }

            if (dx < 0) adherence[0] = true;
            else if (dx > 0) adherence[3] = true;

            {
                newPosition[0] = nx0; entity.v1[0] = 0;
                newPosition[1] = nyt; 
                newPosition[2] = nzt;
            }
            
            // entity.acceleration[0] = 0;
            entity.speed[0] = 0;
            entity.speed[1] = entity._impulseSpeed[1];
            if (entity.acceleration[2] === 0) entity.speed[2] = 0;
        }

        else if (nty) {
            const t = tMaxY-tDeltaY;
            const ddy = dy < 0 ? 1 : -1;

            let nx = x1+(x2-x1);
            let nxt = x1+(x2-x1)*t;
            let dbx = Math.abs(Math.floor(nx)-Math.floor(nxt));
            if (dbx < 2) {
                if (dx < 0) {
                    const free = world.isFree([i-1, j+ddy, k]);
                    if ((!free && dbx < 1 && nx > nx0-1) || free) { nxt = nx; adherence[0] = false; }
                    else { nxt = nx0-1; if (dbx > 0 && !free) adherence[0] = true; }
                }
                if (dx > 0) {
                    const free = world.isFree([i+1, j+ddy, k]);
                    if ((!free && dbx < 1 && nx < nx0+1) || free) { nxt = nx; adherence[3] = false; }
                    else { nxt = nx0+1; if (dbx > 0 && !free) adherence[3] =  true; }
                }
            }

            let nz = z1+(z2-z1);
            let nzt = z1+(z2-z1)*t;
            let dbz = Math.abs(Math.floor(nz)-Math.floor(nzt));
            if (dbz < 2) {
                if (dz < 0) {
                    const free = world.isFree([i, j+ddy, k-1]);
                    if ((!free && dbz < 1 && nz > nz0-1) || free) { nzt = nz; adherence[2] = false;}
                    else { nzt = nz0-1; if (dbz > 0 && !free) adherence[2] = true; }
                }
                if (dz > 0) {
                    const free = world.isFree([i, j+ddy, k+1]);
                    if ((!free && dbz < 1 && nz < nz0+1) || free) { nzt = nz; adherence[5] = false; }
                    else { nzt = nz0+1; if (dbz > 0 && !free) adherence[5] = true; }
                }
            }

            if (dy < 0) adherence[1] = true;
            else if (dy > 0) adherence[4] = true;

            {
                newPosition[0] = nxt;
                newPosition[1] = ny0; entity.v1[1] = 0;
                newPosition[2] = nzt;
            }
            
            // entity.acceleration[1] = 0;
            entity.speed[0] = entity._impulseSpeed[0];
            entity.speed[1] = 0;
            if (entity.acceleration[2] === 0) entity.speed[2] = 0;
        }

        else if (ntz) {
            const t = tMaxZ-tDeltaZ;
            const ddz = dz < 0 ? 1 : -1;

            let nx = x1+(x2-x1);
            let nxt = x1+(x2-x1)*t;
            let dbx = Math.abs(Math.floor(nx)-Math.floor(nxt));
            if (dbx < 2) {
                if (dx < 0) {
                    const free = world.isFree([i-1, j, k+ddz]);
                    if ((!free && dbx < 1 && nx > nx0-1) || free) { nxt = nx; adherence[0] = false; }
                    else { nxt = nx0-1; if (dbx > 0 && !free) adherence[0] = true; }
                }
                if (dx > 0) {
                    const free = world.isFree([i+1, j, k+ddz]);
                    if ((!free && dbx < 1 && nx < nx0+1) || free ) { nxt = nx; adherence[3] = false; }
                    else { nxt = nx0+1; if (dbx > 0 && !free) adherence[3] = true; }
                }
            }

            let ny = y1+(y2-y1);
            let nyt = y1+(y2-y1)*t;
            let dby = Math.abs(Math.floor(ny)-Math.floor(nyt));
            if (dby < 2) {
                if (dy < 0) {
                    const free = world.isFree([i, j-1, k+ddz]);
                    if ((!free && dby < 1 && ny > ny0-1) || free) { nyt = ny; adherence[1] = false; }
                    else { nyt = ny0-1; if (dby > 0 && !free) adherence[1] = true; }
                }
                if (dy > 0) {
                    const free = world.isFree([i, j+1, k+ddz]);
                    if ((!free && dby < 1 && ny < ny0+1) || free) { nyt = ny; adherence[4] = false; }
                    else { nyt = ny0+1; if (dby > 0 && !free) adherence[4] = true; }
                }
            }

            // One impulse allowed
            if (dz < 0) {
                adherence[2] = true;
                adherence[5] = false;
            }
            else if (dz > 0) {
                adherence[2] = false;
                adherence[5] = true;
            }

            {
                newPosition[0] = nxt;
                newPosition[1] = nyt;
                newPosition[2] = nz0; entity.v1[2] = 0;
            }
            
            // entity.acceleration[2] = 0;
            entity.speed = entity._impulseSpeed;
            entity.speed[2] = 0;
        }

        // Bounce
        // entity.speed[2] = -(entity.speed[2]-entity._impulseSpeed[2]);
        // entity.acceleration = [0, 0, 0]; // Use Euler with collisions
        
        // for (let ii = 0; ii < 3; ++ii) {

            //if (ltNew && entity.adherence[ii]) {
            //    entity.position[ii] = Math.floor(entity.position[ii])+tol;
            //} else if (gtNew && entity.adherence[ii+3]) {
            //    entity.position[ii] = Math.ceil(entity.position[ii])-tol;
            //} else {
            //    entity.position[ii] = newPosition[ii];
            //}

            //if (entity.adherence[ii] && newPosition[ii] > entity.position[ii]) entity.adherence[ii] = false;
            //if (entity.adherence[3+ii] && newPosition[ii] < entity.position[ii]) entity.adherence[3+ii] = false;
            // if (newPosition[ii] < entity.position[ii] && oldAdherence[ii]) continue;
            // if (newPosition[ii] > entity.position[ii] && oldAdherence[3+ii]) continue;
            // entity.position[ii] = newPosition[ii];

            //entity.adherence[ii+ (ltNew ? 0 : 3)] = false;
        //}

        return true;

    }

}

export default TerrainCollider;
