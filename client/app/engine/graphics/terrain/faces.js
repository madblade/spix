/**
 *
 */

'use strict';

var FacesModule = {

    setColor: function(/*iChunkOffset, jChunkOffset, kChunkOffset, color*/) {
        // TODO remove chunkSize
        //var chunkSizeX = this.chunkSizeX;
        //var chunkSizeY = this.chunkSizeY;
        //color.setRGB((iChunkOffset/chunkSizeX)%2/2+0.5, (jChunkOffset/chunkSizeY)%2/2+0.5, 0.6);
    },

    getTexture: function(nature) {
        return this.textureCoordinates[nature];
    },

    addFace: function(faceId, i, iS, ijS, ijkS,
                       positions, normals, colors, uvs, nature,
                       iChunkOffset, jChunkOffset, kChunkOffset,
                       pA, pB, pC, cb, ab,
                       normal, color)
    {
        var j;
        var ax; var bx; var cx; var dx; var ay; var by; var cy; var dy; var az; var bz; var cz; var dz;
        var ii; var jj; var kk;
        var nx; var ny; var nz;

        // UVS
        var uvi = 2 * i / 3;
        var scalingHD = 8; // depends on texture resolution
        var ɛ = 0.00390625 / scalingHD; // remove 1 pixel (prevent from texture interpolation on edges)
        var txCoords = this.getTexture(nature);
        if (!txCoords) {
            console.log('Texture not found for index ' + nature);
            return;
        }
        var offsetU; var offsetV;

        if (faceId < ijkS) // I
        {
            ii = faceId % iS;
            jj = ((faceId - ii) % ijS) / iS;
            kk = Math.floor(faceId / ijS);

            ax = iChunkOffset + 1 + ii; ay = jChunkOffset + jj; az = kChunkOffset + kk;
            bx = ax; by = ay; bz = az + 1;
            cx = ax; cy = ay + 1; cz = az + 1;
            dx = ax; dy = ay + 1; dz = az;

            // Positions H1
            positions[i]   = ax; positions[i + 1] = ay; positions[i + 2] = az;
            positions[i + 3] = normal ? bx : cx; positions[i + 4] = normal ? by : cy; positions[i + 5] = normal ? bz : cz;
            positions[i + 6] = normal ? cx : bx; positions[i + 7] = normal ? cy : by; positions[i + 8] = normal ? cz : bz;

            // Normals H1
            pA.set(ax, ay, az);
            normal ? pB.set(bx, by, bz) : pB.set(cx, cy, cz);
            normal ? pC.set(cx, cy, cz) : pC.set(bx, by, bz);
            cb.subVectors(pC, pB);
            ab.subVectors(pA, pB);
            cb.cross(ab);
            cb.normalize();
            nx = cb.x; ny = cb.y; nz = cb.z;
            for (j = 0; j < 3; ++j) {
                normals[i + 3 * j]   = nx;
                normals[i + 3 * j + 1] = ny;
                normals[i + 3 * j + 2] = nz;
            }

            // Colors H1
            this.setColor(iChunkOffset, jChunkOffset, kChunkOffset, color);
            for (j = 0; j < 3; ++j) {
                colors[i + j * 3] = color.r;
                colors[i + j * 3 + 1] = color.g;
                colors[i + j * 3 + 2] = color.b;
            }

            // UVs H1
            offsetU = (normal ? txCoords[0][0] : txCoords[3][0]) * 0.0625;
            offsetV = (normal ? txCoords[0][1] : txCoords[3][1]) * 0.0625;
            uvs[uvi]    = offsetU + 0. + ɛ;                       uvs[uvi + 1] = offsetV + 0. + ɛ;
            uvs[uvi + 2]  = offsetU + (normal ? 0. + ɛ : 0.0625 - ɛ); uvs[uvi + 3] = offsetV + 0.0625 - ɛ;
            uvs[uvi + 4]  = offsetU + (normal ? 0.0625 - ɛ : 0. + ɛ); uvs[uvi + 5] = offsetV + 0.0625 - ɛ;

            // Positions H1
            positions[i + 9]  = ax; positions[i + 10] = ay; positions[i + 11] = az;
            positions[i + 12] = normal ? cx : dx; positions[i + 13] = normal ? cy : dy; positions[i + 14] = normal ? cz : dz;
            positions[i + 15] = normal ? dx : cx; positions[i + 16] = normal ? dy : cy; positions[i + 17] = normal ? dz : cz;

            // Normals H2
            pA.set(ax, ay, az);
            normal ? pB.set(cx, cy, cz) : pB.set(dx, dy, dz);
            normal ? pC.set(dx, dy, dz) : pC.set(cx, cy, cz);
            cb.subVectors(pC, pB);
            ab.subVectors(pA, pB);
            cb.cross(ab);
            cb.normalize();
            nx = cb.x; ny = cb.y; nz = cb.z;
            for (j = 0; j < 3; ++j) {
                normals[i + 9 + 3 * j]   = nx;
                normals[i + 9 + 3 * j + 1] = ny;
                normals[i + 9 + 3 * j + 2] = nz;
            }

            // Colors H2
            this.setColor(iChunkOffset, jChunkOffset, kChunkOffset, color);
            for (j = 0; j < 3; ++j) {
                colors[i + 9 + j * 3] = color.r;
                colors[i + 9 + j * 3 + 1] = color.g;
                colors[i + 9 + j * 3 + 2] = color.b;
            }

            // UVs H2
            uvs[uvi + 6]  = offsetU + 0. + ɛ;     uvs[uvi + 7]  = offsetV + 0. + ɛ;
            uvs[uvi + 8]  = offsetU + 0.0625 - ɛ; uvs[uvi + 9]  = offsetV + (normal ? 0.0625 - ɛ : 0. + ɛ);
            uvs[uvi + 10] = offsetU + 0.0625 - ɛ; uvs[uvi + 11] = offsetV + (normal ? 0. + ɛ : 0.0625 - ɛ);
        }

        else if (faceId < 2 * ijkS) // J
        {
            faceId -= ijkS;
            ii = faceId % iS;
            jj = ((faceId - ii) % ijS) / iS;
            kk = Math.floor(faceId / ijS);

            ax = iChunkOffset + ii; ay = jChunkOffset + 1 + jj; az = kChunkOffset + kk;
            bx = ax + 1; by = ay; bz = az;
            cx = ax + 1; cy = ay; cz = az + 1;
            dx = ax; dy = ay; dz = az + 1;

            positions[i]   = ax; positions[i + 1] = ay; positions[i + 2] = az;
            positions[i + 3] = normal ? bx : cx; positions[i + 4] = normal ? by : cy; positions[i + 5] = normal ? bz : cz;
            positions[i + 6] = normal ? cx : bx; positions[i + 7] = normal ? cy : by; positions[i + 8] = normal ? cz : bz;

            // Normals H1
            pA.set(ax, ay, az);
            normal ? pB.set(bx, by, bz) : pB.set(cx, cy, cz);
            normal ? pC.set(cx, cy, cz) : pC.set(bx, by, bz);
            cb.subVectors(pC, pB);
            ab.subVectors(pA, pB);
            cb.cross(ab);
            cb.normalize();
            nx = cb.x; ny = cb.y; nz = cb.z;
            for (j = 0; j < 3; ++j) {
                normals[i + 3 * j]   = nx;
                normals[i + 3 * j + 1] = ny;
                normals[i + 3 * j + 2] = nz;
            }

            // Colors H1
            this.setColor(iChunkOffset, jChunkOffset, kChunkOffset, color);
            for (j = 0; j < 3; ++j) {
                colors[i + j * 3] = color.r;
                colors[i + j * 3 + 1] = color.g;
                colors[i + j * 3 + 2] = color.b;
            }

            // UVs H1
            offsetU = (normal ? txCoords[1][0] : txCoords[4][0]) * 0.0625;
            offsetV = (normal ? txCoords[1][1] : txCoords[4][1]) * 0.0625;
            uvs[uvi]    = offsetU + (normal ? 0.0625 - ɛ : 0. + ɛ); uvs[uvi + 1] = offsetV + (0. + ɛ);
            uvs[uvi + 2]  = offsetU + (normal ? 0. + ɛ : 0.0625 - ɛ); uvs[uvi + 3] = offsetV + (normal ? 0. + ɛ : 0.0625 - ɛ);
            uvs[uvi + 4]  = offsetU + (normal ? 0. + ɛ : 0.0625 - ɛ); uvs[uvi + 5] = offsetV + (normal ? 0.0625 - ɛ : 0. + ɛ);

            // Positions H2
            positions[i + 9]  = ax; positions[i + 10] = ay; positions[i + 11] = az;
            positions[i + 12] = normal ? cx : dx; positions[i + 13] = normal ? cy : dy; positions[i + 14] = normal ? cz : dz;
            positions[i + 15] = normal ? dx : cx; positions[i + 16] = normal ? dy : cy; positions[i + 17] = normal ? dz : cz;

            // Normals H2
            pA.set(ax, ay, az);
            normal ? pB.set(cx, cy, cz) : pB.set(dx, dy, dz);
            normal ? pC.set(dx, dy, dz) : pC.set(cx, cy, cz);
            cb.subVectors(pC, pB);
            ab.subVectors(pA, pB);
            cb.cross(ab);
            cb.normalize();
            nx = cb.x; ny = cb.y; nz = cb.z;
            for (j = 0; j < 3; ++j) {
                normals[i + 9 + 3 * j]   = nx;
                normals[i + 9 + 3 * j + 1] = ny;
                normals[i + 9 + 3 * j + 2] = nz;
            }

            // Colors H2
            this.setColor(iChunkOffset, jChunkOffset, kChunkOffset, color);
            for (j = 0; j < 3; ++j) {
                colors[i + 9 + j * 3] = color.r;
                colors[i + 9 + j * 3 + 1] = color.g;
                colors[i + 9 + j * 3 + 2] = color.b;
            }

            // UVs H2
            uvs[uvi + 6]  = offsetU + (normal ? 0.0625 - ɛ : 0. + ɛ); uvs[uvi + 7]  = offsetV + 0. + ɛ;
            uvs[uvi + 8]  = offsetU + 0. + ɛ;                       uvs[uvi + 9]  = offsetV + 0.0625 - ɛ;
            uvs[uvi + 10] = offsetU + 0.0625 - ɛ;                   uvs[uvi + 11] = offsetV + 0.0625 - ɛ;
        }

        else // K
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
            positions[i]   = ax; positions[i + 1] = ay; positions[i + 2] = az;
            positions[i + 3] = normal ? bx : cx; positions[i + 4] = normal ? by : cy; positions[i + 5] = normal ? bz : cz;
            positions[i + 6] = normal ? cx : bx; positions[i + 7] = normal ? cy : by; positions[i + 8] = normal ? cz : bz;

            // Normals H1
            pA.set(ax, ay, az);
            normal ? pB.set(bx, by, bz) : pB.set(cx, cy, cz);
            normal ? pC.set(cx, cy, cz) : pC.set(bx, by, bz);
            cb.subVectors(pC, pB);
            ab.subVectors(pA, pB);
            cb.cross(ab);
            cb.normalize();
            nx = cb.x; ny = cb.y; nz = cb.z;
            for (j = 0; j < 3; ++j) {
                normals[i + 3 * j] = nx;
                normals[i + 3 * j + 1] = ny;
                normals[i + 3 * j + 2] = nz;
            }

            // Colors H1
            this.setColor(iChunkOffset, jChunkOffset, kChunkOffset, color);
            for (j = 0; j < 3; ++j) {
                colors[i + j * 3] = color.r;
                colors[i + j *  3 + 1] = color.g;
                colors[i + j * 3 + 2] = color.b;
            }

            // UVs H1
            offsetU = (normal ? txCoords[2][0] : txCoords[5][0]) * 0.0625;
            offsetV = (normal ? txCoords[2][1] : txCoords[5][1]) * 0.0625;
            uvs[uvi]    = offsetU + 0. + ɛ;                       uvs[uvi + 1] = offsetV + 0. + ɛ;
            uvs[uvi + 2]  = offsetU + (normal ? 0. + ɛ : 0.0625 - ɛ); uvs[uvi + 3] = offsetV + 0.0625 - ɛ;
            uvs[uvi + 4]  = offsetU + (normal ? 0.0625 - ɛ : 0. + ɛ); uvs[uvi + 5] = offsetV + 0.0625 - ɛ;

            // Positions H2
            positions[i + 9]  = ax; positions[i + 10] = ay; positions[i + 11] = az;
            positions[i + 12] = normal ? cx : dx; positions[i + 13] = normal ? cy : dy; positions[i + 14] = normal ? cz : dz;
            positions[i + 15] = normal ? dx : cx; positions[i + 16] = normal ? dy : cy; positions[i + 17] = normal ? dz : cz;

            // Normals H2
            pA.set(ax, ay, az);
            normal ? pB.set(cx, cy, cz) : pB.set(dx, dy, dz);
            normal ? pC.set(dx, dy, dz) : pC.set(cx, cy, cz);
            cb.subVectors(pC, pB);
            ab.subVectors(pA, pB);
            cb.cross(ab);
            cb.normalize();
            nx = cb.x; ny = cb.y; nz = cb.z;
            for (j = 0; j < 3; ++j) {
                normals[i + 9 + 3 * j]   = nx;
                normals[i + 9 + 3 * j + 1] = ny;
                normals[i + 9 + 3 * j + 2] = nz;
            }

            // Colors H2
            this.setColor(iChunkOffset, jChunkOffset, kChunkOffset, color);
            for (j = 0; j < 3; ++j) {
                colors[i + 9 + j * 3] = color.r;
                colors[i + 9 + j * 3 + 1] = color.g;
                colors[i + 9 + j * 3 + 2] = color.b;
            }

            // UVs H2
            uvs[uvi + 6]  = offsetU + 0. + ɛ;     uvs[uvi + 7]  = offsetV + 0. + ɛ;
            uvs[uvi + 8]  = offsetU + 0.0625 - ɛ; uvs[uvi + 9]  = offsetV + (normal ? 0.0625 - ɛ : 0. + ɛ);
            uvs[uvi + 10] = offsetU + 0.0625 - ɛ; uvs[uvi + 11] = offsetV + (normal ? 0. + ɛ : 0.0625 - ɛ);
        }

        for (j = 0; j < 18; ++j) {
            if (isNaN(positions[i + j])) {
                console.log('Transferred miscalculation on ' + i + 'th component.' +
                    '\tnormal: ' + normal + '\n' +
                    '\tfaceId: ' + faceId
                );
                return;
            }
        }
    }

};

export { FacesModule };
