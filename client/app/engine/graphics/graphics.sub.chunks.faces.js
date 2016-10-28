/**
 *
 */

'use strict';

App.Engine.Graphics.prototype.setColor = function(iChunkOffset, jChunkOffset, kChunkOffset, color) {
    color.setRGB((iChunkOffset/this.chunkSizeX)%2/2+0.5, (jChunkOffset/this.chunkSizeY)%2/2+0.5, 0.6);
};

App.Engine.Graphics.prototype.addFace = function(faceId, i, iS, ijS, ijkS,
                                                 positions, normals, colors, uvs, nature,
                                                 iChunkOffset, jChunkOffset, kChunkOffset,
                                                 pA, pB, pC, cb, ab,
                                                 normal, color, n) {

    var j;
    var ax, bx, cx, dx, ay, by, cy, dy, az, bz, cz, dz;
    var ii, jj, kk;
    var nx, ny, nz;
    var uvi = 2*i/3;

    if (faceId < ijkS)
    {
        ii = faceId % iS;
        jj = ((faceId - ii) % ijS) / iS;
        kk = Math.floor(faceId / ijS);

        ax = iChunkOffset + 1 + ii; ay = jChunkOffset + jj; az = kChunkOffset + kk;
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
        //color.setRGB((ax/n)+0.5, (ay/n)+0.5, (az/n)+0.5);
        this.setColor(iChunkOffset, jChunkOffset, kChunkOffset, color);
        for (j = 0; j<3; ++j) {colors[i+j*3] = color.r; colors[i+j*3+1] = color.g; colors[i+j*3+2] = color.b;}

        uvs[uvi] = 0.; uvs[uvi+1] = 0.;
        uvs[uvi+2] = normal ? 0. : 0.0625; uvs[uvi+3] = 0.0625;
        uvs[uvi+4] = normal ? 0.0625 : 0.; uvs[uvi+5] = 0.0625;

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
        //color.setRGB((ax/n)+0.5, (ay/n)+0.5, (az/n)+0.5);
        this.setColor(iChunkOffset, jChunkOffset, kChunkOffset, color);
        for (j = 0; j<3; ++j) {colors[i+9+j*3] = color.r; colors[i+9+j*3+1] = color.g; colors[i+9+j*3+2] = color.b;}

        uvs[uvi+6] = 0.; uvs[uvi+7] = 0.;
        uvs[uvi+8] = 0.0625; uvs[uvi+9] = normal ? 0.0625 : 0.;
        uvs[uvi+10] = 0.0625; uvs[uvi+11] = normal ? 0. : 0.0625;

    }
    else if (faceId < 2 * ijkS)
    {
        faceId -= ijkS;
        ii = faceId % iS;
        jj = ((faceId - ii) % ijS) / iS;
        kk = Math.floor(faceId / ijS);

        ax = iChunkOffset + ii; ay = jChunkOffset + 1 + jj; az = kChunkOffset + kk;
        bx = ax + 1; by = ay; bz = az;
        cx = ax + 1; cy = ay; cz = az + 1;
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
        //color.setRGB((ax/n)+0.5, (ay/n)+0.5, (az/n)+0.5);
        this.setColor(iChunkOffset, jChunkOffset, kChunkOffset, color);
        for (j = 0; j<3; ++j) {colors[i+j*3] = color.r; colors[i+j*3+1] = color.g; colors[i+j*3+2] = color.b;}

        uvs[uvi] = 0.; uvs[uvi+1] = 0.;
        uvs[uvi+2] = normal ? 0. : 0.0625; uvs[uvi+3] = 0.0625;
        uvs[uvi+4] = normal ? 0.0625 : 0.; uvs[uvi+5] = 0.0625;

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
        //color.setRGB((ax/n)+0.5, (ay/n)+0.5, (az/n)+0.5);
        this.setColor(iChunkOffset, jChunkOffset, kChunkOffset, color);
        for (j = 0; j<3; ++j) {colors[i+9+j*3] = color.r; colors[i+9+j*3+1] = color.g; colors[i+9+j*3+2] = color.b;}

        uvs[uvi+6] = 0.; uvs[uvi+7] = 0.;
        uvs[uvi+8] = 0.0625; uvs[uvi+9] = normal ? 0.0625 : 0.;
        uvs[uvi+10] = 0.0625; uvs[uvi+11] = normal ? 0. : 0.0625;

    }
    else
    {
        faceId -= (2 * ijkS);
        ii = faceId % iS;
        jj = ((faceId - ii) % ijS) / iS;
        kk = Math.floor(faceId / ijS);

        ax = iChunkOffset + ii; ay = jChunkOffset + jj; az = kChunkOffset + 1 + kk;
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
        for (j = 0; j<3; ++j) {normals[i+3*j] = nx; normals[i+3*j+1] = ny; normals[i+3*j+2] = nz;}

        // Colors H1
        //color.setRGB((ax/n)+0.5, (ay/n)+0.5, (az/n)+0.5);
        this.setColor(iChunkOffset, jChunkOffset, kChunkOffset, color);
        for (j = 0; j<3; ++j) {colors[i+j*3] = color.r; colors[i+j*3+1] = color.g; colors[i+j*3+2] = color.b;}

        uvs[uvi] = 0.; uvs[uvi+1] = 0.;
        uvs[uvi+2] = normal ? 0. : 0.0625; uvs[uvi+3] = 0.0625;
        uvs[uvi+4] = normal ? 0.0625 : 0.; uvs[uvi+5] = 0.0625;

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
        //color.setRGB((ax/n)+0.5, (ay/n)+0.5, (az/n)+0.5);
        this.setColor(iChunkOffset, jChunkOffset, kChunkOffset, color);
        for (j = 0; j<3; ++j) {colors[i+9+j*3] = color.r; colors[i+9+j*3+1] = color.g; colors[i+9+j*3+2] = color.b;}

        uvs[uvi+6] = 0.; uvs[uvi+7] = 0.;
        uvs[uvi+8] = 0.0625; uvs[uvi+9] = 0.0625;
        uvs[uvi+10] = 0.0625; uvs[uvi+11] = 0.;

    }

    for (j = 0; j<18; ++j) {
        if (isNaN(positions[i+j])) {
            console.log('Transferred miscalculation on ' + i + 'th component.' +
                '\tnormal: ' + normal+'\n' +
                '\tfaceId: ' + faceId
            );
            return;
        }
    }
};
