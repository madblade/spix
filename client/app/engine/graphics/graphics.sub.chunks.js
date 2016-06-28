/**
 *
 */

'use strict';

App.Engine.Graphics.prototype.isChunkLoaded = function(chunkId) {
    return this.chunks.hasOwnProperty(chunkId);
};

App.Engine.Graphics.prototype.initChunk = function(chunkId, components) {
    this.chunks[chunkId] = {};
    var c = this.chunks[chunkId];
    c.geometry = new THREE.BufferGeometry();

    var currentComponent;
    for (var cid in components) {
        // TODO several components
        if (!components.hasOwnProperty(cid)) continue;
        currentComponent = components[cid];
        break;
    }

    var chunkIndices = chunkId.split(',');
    var chunkI = parseInt(chunkIndices[0]);
    var chunkJ = parseInt(chunkIndices[1]);
    var iChunkOffset = chunkI * this.chunkSizeX;
    var jChunkOffset = chunkJ * this.chunkSizeY;

    var ijkS = this.chunkCapacity;
    var ijS = this.chunkSizeX * this.chunkSizeY;
    var iS = this.chunkSizeX;
    var triangles = 2 * currentComponent.length;
    var positions = new Float32Array(triangles * 3 * 3);
    var normals = new Float32Array(triangles * 3 * 3);
    var colors = new Float32Array(triangles * 3 * 3);

    var pA = new THREE.Vector3();
    var pB = new THREE.Vector3();
    var pC = new THREE.Vector3();
    var cb = new THREE.Vector3();
    var ab = new THREE.Vector3();
    var ax, bx, cx, dx, ay, by, cy, dy, az, bz, cz, dz;
    var ii, jj, kk;
    var nx, ny, nz;
    var j;

    var i = 0;
    for (var f = 0; f < currentComponent.length; ++f) {
        var faceId = Math.abs(currentComponent[f]);
        var normal = faceId > 0;
        if (faceId < ijS) {
            ii = faceId % iS;
            jj = (faceId - ii) / iS;
            kk = (faceId - ii - jj*iS) / ijS;

            ax = iChunkOffset + 1 + ii;
            ay = jChunkOffset + jj;
            az = kk;
            bx = ax;
            by = ay;
            bz = az + 1;
            cx = ax;
            cy = ay + 1;
            cz = az + 1;
            dx = ax;
            dy = ay + 1;
            dz = az;

            positions[i] = ax;
            positions[i+1] = ay;
            positions[i+2] = az;
            positions[i+3] = normal ? bx : cx;
            positions[i+4] = normal ? by : cy;
            positions[i+5] = normal ? bz : cz;
            positions[i+6] = normal ? cx : bx;
            positions[i+7] = normal ? cy : by;
            positions[i+8] = normal ? cz : bz;

            // Compute normals.
            pA.set(ax, ay, az);
            normal ? pB.set(bx, by, bz) : pB.set(cx, cy, cz);
            normal ? pC.set(cx, cy, cz) : pC.set(bx, by, bz);
            cb.subVectors(pC, pB);
            ab.subVectors(pA, pB);
            cb.cross(ab);
            cb.normalize();
            nx = cb.x;
            ny = cb.y;
            nz = cb.z;
            for (j = 0; j<3; ++j) {
                normals[i+3*j]   = nx;
                normals[i+3*j+1] = ny;
                normals[i+3*j+2] = nz;
            }

            positions[i+9]  = ax;
            positions[i+10] = ay;
            positions[i+11] = az;
            positions[i+12] = normal ? cx : dx;
            positions[i+13] = normal ? cy : dy;
            positions[i+14] = normal ? cz : dz;
            positions[i+15] = normal ? dx : cx;
            positions[i+16] = normal ? dy : cy;
            positions[i+17] = normal ? dz : cz;

            // Compute normals.
            pA.set(ax, ay, az);
            normal ? pB.set(cx, cy, cz) : pB.set(dx, dy, dz);
            normal ? pC.set(dx, dy, dz) : pC.set(cx, cy, cz);
            cb.subVectors(pC, pB);
            ab.subVectors(pA, pB);
            cb.cross(ab);
            cb.normalize();
            for (j = 0; j<3; ++j) {
                normals[i+9+3*j]   = nx;
                normals[i+9+3*j+1] = ny;
                normals[i+9+3*j+2] = nz;
            }

        } else if (faceId < 2 * ijS) {
            faceId -= ijS;
            ii = faceId % iS;
            jj = (faceId - ii) / iS;
            kk = (faceId - ii - jj*iS) / ijS;

            ax = iChunkOffset + ii;
            ay = jChunkOffset + 1 + jj;
            az = kk;
            bx = ax + 1;
            by = ay;
            bz = az;
            cx = ax + 1;
            cy = ay;
            cz = az;
            dx = ax;
            dy = ay;
            dz = az + 1;

            positions[i] = ax;
            positions[i+1] = ay;
            positions[i+2] = az;
            positions[i+3] = normal ? bx : cx;
            positions[i+4] = normal ? by : cy;
            positions[i+5] = normal ? bz : cz;
            positions[i+6] = normal ? cx : bx;
            positions[i+7] = normal ? cy : by;
            positions[i+8] = normal ? cz : bz;

            // Compute normals.
            pA.set(ax, ay, az);
            normal ? pB.set(bx, by, bz) : pB.set(cx, cy, cz);
            normal ? pC.set(cx, cy, cz) : pC.set(bx, by, bz);
            cb.subVectors(pC, pB);
            ab.subVectors(pA, pB);
            cb.cross(ab);
            cb.normalize();
            nx = cb.x;
            ny = cb.y;
            nz = cb.z;
            for (j = 0; j<3; ++j) {
                normals[i+3*j]   = nx;
                normals[i+3*j+1] = ny;
                normals[i+3*j+2] = nz;
            }

            positions[i+9]  = ax;
            positions[i+10] = ay;
            positions[i+11] = az;
            positions[i+12] = normal ? cx : dx;
            positions[i+13] = normal ? cy : dy;
            positions[i+14] = normal ? cz : dz;
            positions[i+15] = normal ? dx : cx;
            positions[i+16] = normal ? dy : cy;
            positions[i+17] = normal ? dz : cz;

            // Compute normals.
            pA.set(ax, ay, az);
            normal ? pB.set(cx, cy, cz) : pB.set(dx, dy, dz);
            normal ? pC.set(dx, dy, dz) : pC.set(cx, cy, cz);
            cb.subVectors(pC, pB);
            ab.subVectors(pA, pB);
            cb.cross(ab);
            cb.normalize();

            for (j = 0; j<3; ++j) {
                normals[i+9+3*j]   = nx;
                normals[i+9+3*j+1] = ny;
                normals[i+9+3*j+2] = nz;
            }

        } else {
            faceId -= (2 * ijkS);
            ii = faceId % iS;
            jj = ((faceId - ii) % ijS) / iS;
            kk = Math.floor(faceId / ijS);

            console.log(ii + " " + jj + " " + kk);

            ax = iChunkOffset + ii;
            ay = jChunkOffset + jj;
            az = 1 + kk;
            bx = ax;
            by = ay + 1;
            bz = az;
            cx = ax + 1;
            cy = ay + 1;
            cz = az;
            dx = ax + 1;
            dy = ay;
            dz = az;

            positions[i] = ax;
            positions[i+1] = ay;
            positions[i+2] = az;
            positions[i+3] = normal ? bx : cx;
            positions[i+4] = normal ? by : cy;
            positions[i+5] = normal ? bz : cz;
            positions[i+6] = normal ? cx : bx;
            positions[i+7] = normal ? cy : by;
            positions[i+8] = normal ? cz : bz;

            // Compute normals.
            pA.set(ax, ay, az);
            normal ? pB.set(bx, by, bz) : pB.set(cx, cy, cz);
            normal ? pC.set(cx, cy, cz) : pC.set(bx, by, bz);
            cb.subVectors(pC, pB);
            ab.subVectors(pA, pB);
            cb.cross(ab);
            cb.normalize();
            nx = cb.x;
            ny = cb.y;
            nz = cb.z;
            for (j = 0; j<3; ++j) {
                normals[i+3*j]   = nx;
                normals[i+3*j+1] = ny;
                normals[i+3*j+2] = nz;
            }

            positions[i+9]  = ax;
            positions[i+10] = ay;
            positions[i+11] = az;
            positions[i+12] = normal ? cx : dx;
            positions[i+13] = normal ? cy : dy;
            positions[i+14] = normal ? cz : dz;
            positions[i+15] = normal ? dx : cx;
            positions[i+16] = normal ? dy : cy;
            positions[i+17] = normal ? dz : cz;

            // Compute normals.
            pA.set(ax, ay, az);
            normal ? pB.set(cx, cy, cz) : pB.set(dx, dy, dz);
            normal ? pC.set(dx, dy, dz) : pC.set(cx, cy, cz);
            cb.subVectors(pC, pB);
            ab.subVectors(pA, pB);
            cb.cross(ab);
            cb.normalize();

            for (j = 0; j<3; ++j) {
                normals[i+9+3*j]   = nx;
                normals[i+9+3*j+1] = ny;
                normals[i+9+3*j+2] = nz;
            }
        }

        i += 18;
    }

    c.geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
    c.geometry.addAttribute('normal', new THREE.BufferAttribute(normals, 3));
    c.geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3));
    c.geometry.computeBoundingSphere();

    // Make material and mesh.
    c.material = new THREE.MeshPhongMaterial( {
        color: 0xaaaaaa, specular: 0xffffff, shininess: 250,
        side: THREE.DoubleSide, vertexColors: THREE.VertexColors
    } );
    c.mesh = new THREE.Mesh(c.geometry, c.material);

    console.log("adding to scene");
    // Add to scene.
    this.scene.add(c.mesh);
};

// TODO dynamically remove chunks
App.Engine.Graphics.prototype.removeChunk = function(chunkId) {
    delete this.chunks[chunkId];
};

App.Engine.Graphics.prototype.updateChunk = function(chunkId, components) {

};
