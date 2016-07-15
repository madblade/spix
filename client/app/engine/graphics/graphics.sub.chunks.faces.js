/**
 *
 */

'use strict';

App.Engine.Graphics.prototype.addFace = function(faceId, i, iS, ijS, ijkS,
                                                 positions, normals, colors, nature,
                                                 iChunkOffset, jChunkOffset,
                                                 pA, pB, pC, cb, ab,
                                                 normal, color, n) {

    var j;
    var ax, bx, cx, dx, ay, by, cy, dy, az, bz, cz, dz;
    var ii, jj, kk;
    var nx, ny, nz;

    if (faceId < ijkS) {
        ii = faceId % iS;
        jj = ((faceId - ii) % ijS) / iS;
        kk = Math.floor(faceId / ijS);

        ax = iChunkOffset + 1 + ii; ay = jChunkOffset + jj; az = kk;
        bx = ax; by = ay; bz = az + 1;
        cx = ax; cy = ay + 1; cz = az + 1;
        dx = ax; dy = ay + 1; dz = az;

        // Positions H1
        positions[i]   = ax; positions[i+1] = ay; positions[i+2] = az;
        positions[i+3] = normal ? bx : cx; positions[i+4] = normal ? by : cy; positions[i+5] = normal ? bz : cz;
        positions[i+6] = normal ? cx : bx; positions[i+7] = normal ? cy : by; positions[i+8] = normal ? cz : bz;

        // Normals H1
        pA.set(ax, ay, az);
        normal ? pB.set(bx, by, bz) : pB.set(cx, cy, cz);
        normal ? pC.set(cx, cy, cz) : pC.set(bx, by, bz);
        cb.subVectors(pC, pB);
        ab.subVectors(pA, pB);
        cb.cross(ab);
        cb.normalize();
        nx = cb.x; ny = cb.y; nz = cb.z;
        for (j = 0; j<3; ++j) {normals[i+3*j]   = nx; normals[i+3*j+1] = ny; normals[i+3*j+2] = nz;}

        // Colors H1
        color.setRGB((ax/n)+0.5, (ay/n)+0.5, (az/n)+0.5);
        for (j = 0; j<3; ++j) {colors[i+j*3] = color.r; colors[i+j*3+1] = color.g; colors[i+j*3+2] = color.b;}

        // Positions H1
        positions[i+9]  = ax; positions[i+10] = ay; positions[i+11] = az;
        positions[i+12] = normal ? cx : dx; positions[i+13] = normal ? cy : dy; positions[i+14] = normal ? cz : dz;
        positions[i+15] = normal ? dx : cx; positions[i+16] = normal ? dy : cy; positions[i+17] = normal ? dz : cz;

        // Normals H2
        pA.set(ax, ay, az);
        normal ? pB.set(cx, cy, cz) : pB.set(dx, dy, dz);
        normal ? pC.set(dx, dy, dz) : pC.set(cx, cy, cz);
        cb.subVectors(pC, pB);
        ab.subVectors(pA, pB);
        cb.cross(ab);
        cb.normalize();
        nx = cb.x; ny = cb.y; nz = cb.z;
        for (j = 0; j<3; ++j) {normals[i+9+3*j]   = nx; normals[i+9+3*j+1] = ny; normals[i+9+3*j+2] = nz;}

        // Colors H2
        color.setRGB((ax/n)+0.5, (ay/n)+0.5, (az/n)+0.5);
        for (j = 0; j<3; ++j) {colors[i+9+j*3] = color.r; colors[i+9+j*3+1] = color.g; colors[i+9+j*3+2] = color.b;}

    } else if (faceId < 2 * ijkS) {
        faceId -= ijkS;
        ii = faceId % iS;
        jj = ((faceId - ii) % ijS) / iS;
        kk = Math.floor(faceId / ijS);

        ax = iChunkOffset + ii; ay = jChunkOffset + 1 + jj; az = kk;
        bx = ax + 1; by = ay; bz = az;
        cx = ax + 1; cy = ay; cz = az + 1; // TODO check this
        dx = ax; dy = ay; dz = az + 1;

        positions[i]   = ax; positions[i+1] = ay; positions[i+2] = az;
        positions[i+3] = normal ? bx : cx; positions[i+4] = normal ? by : cy; positions[i+5] = normal ? bz : cz;
        positions[i+6] = normal ? cx : bx; positions[i+7] = normal ? cy : by; positions[i+8] = normal ? cz : bz;

        // Normals H1
        pA.set(ax, ay, az);
        normal ? pB.set(bx, by, bz) : pB.set(cx, cy, cz);
        normal ? pC.set(cx, cy, cz) : pC.set(bx, by, bz);
        cb.subVectors(pC, pB);
        ab.subVectors(pA, pB);
        cb.cross(ab);
        cb.normalize();
        nx = cb.x; ny = cb.y; nz = cb.z;
        for (j = 0; j<3; ++j) {normals[i+3*j]   = nx; normals[i+3*j+1] = ny; normals[i+3*j+2] = nz;}

        // Colors H1
        color.setRGB((ax/n)+0.5, (ay/n)+0.5, (az/n)+0.5);
        for (j = 0; j<3; ++j) {colors[i+j*3] = color.r; colors[i+j*3+1] = color.g; colors[i+j*3+2] = color.b;}

        // Positions H2
        positions[i+9]  = ax; positions[i+10] = ay; positions[i+11] = az;
        positions[i+12] = normal ? cx : dx; positions[i+13] = normal ? cy : dy; positions[i+14] = normal ? cz : dz;
        positions[i+15] = normal ? dx : cx; positions[i+16] = normal ? dy : cy; positions[i+17] = normal ? dz : cz;

        // Normals H2
        pA.set(ax, ay, az);
        normal ? pB.set(cx, cy, cz) : pB.set(dx, dy, dz);
        normal ? pC.set(dx, dy, dz) : pC.set(cx, cy, cz);
        cb.subVectors(pC, pB);
        ab.subVectors(pA, pB);
        cb.cross(ab);
        cb.normalize();
        nx = cb.x; ny = cb.y; nz = cb.z;
        for (j = 0; j<3; ++j) {normals[i+9+3*j]   = nx; normals[i+9+3*j+1] = ny; normals[i+9+3*j+2] = nz;}

        // Colors H2
        color.setRGB((ax/n)+0.5, (ay/n)+0.5, (az/n)+0.5);
        for (j = 0; j<3; ++j) {colors[i+9+j*3] = color.r; colors[i+9+j*3+1] = color.g; colors[i+9+j*3+2] = color.b;}

    } else {
        faceId -= (2 * ijkS);
        ii = faceId % iS;
        jj = ((faceId - ii) % ijS) / iS;
        kk = Math.floor(faceId / ijS);

        ax = iChunkOffset + ii; ay = jChunkOffset + jj; az = 1 + kk;
        bx = ax; by = ay + 1; bz = az;
        cx = ax + 1; cy = ay + 1; cz = az;
        dx = ax + 1; dy = ay; dz = az;

        // Positions H1
        positions[i]   = ax; positions[i+1] = ay; positions[i+2] = az;
        positions[i+3] = normal ? bx : cx; positions[i+4] = normal ? by : cy; positions[i+5] = normal ? bz : cz;
        positions[i+6] = normal ? cx : bx; positions[i+7] = normal ? cy : by; positions[i+8] = normal ? cz : bz;

        // Normals H1
        pA.set(ax, ay, az);
        normal ? pB.set(bx, by, bz) : pB.set(cx, cy, cz);
        normal ? pC.set(cx, cy, cz) : pC.set(bx, by, bz);
        cb.subVectors(pC, pB);
        ab.subVectors(pA, pB);
        cb.cross(ab);
        cb.normalize();
        nx = cb.x; ny = cb.y; nz = cb.z;
        for (j = 0; j<3; ++j) {normals[i+3*j]   = nx; normals[i+3*j+1] = ny; normals[i+3*j+2] = nz;}

        // Colors H1
        color.setRGB((ax/n)+0.5, (ay/n)+0.5, (az/n)+0.5);
        for (j = 0; j<3; ++j) {colors[i+j*3] = color.r; colors[i+j*3+1] = color.g; colors[i+j*3+2] = color.b;}

        // Positions H2
        positions[i+9]  = ax; positions[i+10] = ay; positions[i+11] = az;
        positions[i+12] = normal ? cx : dx; positions[i+13] = normal ? cy : dy; positions[i+14] = normal ? cz : dz;
        positions[i+15] = normal ? dx : cx; positions[i+16] = normal ? dy : cy; positions[i+17] = normal ? dz : cz;

        // Normals H2
        pA.set(ax, ay, az);
        normal ? pB.set(cx, cy, cz) : pB.set(dx, dy, dz);
        normal ? pC.set(dx, dy, dz) : pC.set(cx, cy, cz);
        cb.subVectors(pC, pB);
        ab.subVectors(pA, pB);
        cb.cross(ab);
        cb.normalize();
        nx = cb.x; ny = cb.y; nz = cb.z;
        for (j = 0; j<3; ++j) {normals[i+9+3*j]   = nx; normals[i+9+3*j+1] = ny; normals[i+9+3*j+2] = nz;}

        // Colors H2
        color.setRGB((ax/n)+0.5, (ay/n)+0.5, (az/n)+0.5);
        for (j = 0; j<3; ++j) {colors[i+9+j*3] = color.r; colors[i+9+j*3+1] = color.g; colors[i+9+j*3+2] = color.b;}
    }

    for (j = 0; j<18; ++j) {
        if (isNaN(positions[i+j])) {
            console.log('Transferred miscalculation on ' + (i+j) + 'th component.');
            console.log(
                '\tnormal: ' + normal+'\n'+
                '\tfaceId: ' + faceId
            );
            return;
        }
    }
};
