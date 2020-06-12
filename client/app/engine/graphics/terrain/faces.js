/**
 *
 */

'use strict';

let FacesModule = {

    /**
     * old 1-color-cube API
     * @deprecated
     */
    setColor() // iChunkOffset, jChunkOffset, kChunkOffset, color
    {
        //let chunkSizeX = this.chunkSizeX;
        //let chunkSizeY = this.chunkSizeY;
        //color.setRGB((iChunkOffset/chunkSizeX)%2/2+0.5, (jChunkOffset/chunkSizeY)%2/2+0.5, 0.6);
    },

    getTexture(nature)
    {
        return this.textureCoordinates[nature];
    },

    setPNC1(
        positions, colors, normals,
        i, normal, color,
        ax, ay, az, bx, by, bz, cx, cy, cz, pA, pB, pC,
        ab, cb, iChunkOffset, jChunkOffset, kChunkOffset)
    {
        // Positions
        positions[i + 0] = normal ? cx : cx;
        positions[i + 1] = normal ? cy : cy;
        positions[i + 2] = normal ? cz : cz;

        positions[i + 3] = normal ? bx : ax;
        positions[i + 4] = normal ? by : ay;
        positions[i + 5] = normal ? bz : az;

        positions[i + 6] = normal ? ax : bx;
        positions[i + 7] = normal ? ay : by;
        positions[i + 8] = normal ? az : bz;

        // Normals
        pA.set(ax, ay, az);
        normal ? pB.set(bx, by, bz) : pB.set(cx, cy, cz);
        normal ? pC.set(cx, cy, cz) : pC.set(bx, by, bz);
        cb.subVectors(pC, pB);
        ab.subVectors(pA, pB);
        cb.cross(ab);
        cb.normalize();
        let nx = cb.x; let ny = cb.y; let nz = cb.z;
        for (let j = 0; j < 3; ++j) {
            normals[i + 3 * j]   = -nx;
            normals[i + 3 * j + 1] = -ny;
            normals[i + 3 * j + 2] = -nz;
        }

        // Colors
        this.setColor(iChunkOffset, jChunkOffset, kChunkOffset, color);
        for (let j = 0; j < 3; ++j) {
            colors[i + j * 3] = color.r;
            colors[i + j * 3 + 1] = color.g;
            colors[i + j * 3 + 2] = color.b;
        }
    },

    setPNC2(positions, colors, normals,
        i, normal, color,
        ax, ay, az, cx, cy, cz, dx, dy, dz,
        pA, pB, pC, ab, cb,
        iChunkOffset, jChunkOffset, kChunkOffset)
    {
        // Positions
        positions[i + 9]  = normal ? cx : cx;
        positions[i + 10] = normal ? cy : cy;
        positions[i + 11] = normal ? cz : cz;

        positions[i + 12] = normal ? ax : dx;
        positions[i + 13] = normal ? ay : dy;
        positions[i + 14] = normal ? az : dz;

        positions[i + 15] = normal ? dx : ax;
        positions[i + 16] = normal ? dy : ay;
        positions[i + 17] = normal ? dz : az;

        // Normals
        pA.set(ax, ay, az);
        normal ? pB.set(cx, cy, cz) : pB.set(dx, dy, dz);
        normal ? pC.set(dx, dy, dz) : pC.set(cx, cy, cz);
        cb.subVectors(pC, pB);
        ab.subVectors(pA, pB);
        cb.cross(ab);
        cb.normalize();
        let nx = cb.x; let ny = cb.y; let nz = cb.z;
        for (let j = 0; j < 3; ++j) {
            normals[i + 9 + 3 * j]   = -nx;
            normals[i + 9 + 3 * j + 1] = -ny;
            normals[i + 9 + 3 * j + 2] = -nz;
        }

        // Colors
        this.setColor(iChunkOffset, jChunkOffset, kChunkOffset, color);
        for (let j = 0; j < 3; ++j) {
            colors[i + 9 + j * 3] = color.r;
            colors[i + 9 + j * 3 + 1] = color.g;
            colors[i + 9 + j * 3 + 2] = color.b;
        }
    },

    addFace(faceId, pos, iS, ijS, ijkS,
        positions, normals, colors, uvs, nature,
        iChunkOffset, jChunkOffset, kChunkOffset,
        pA, pB, pC, cb, ab,
        normal, color)
    {
        const i = pos * 18;
        let j;
        let ax; let bx; let cx; let dx;
        let ay; let by; let cy; let dy;
        let az; let bz; let cz; let dz;
        let ii; let jj; let kk;

        // UVS
        let uvi = 2 * i / 3;
        let scalingHD = 8; // depends on texture resolution
        // let scalingHD = 1; // for 512 texture
        let eps = 0.00390625 / scalingHD; // remove 1 pixel (prevent from texture interpolation on edges)
        let txCoords = this.getTexture(nature);
        if (!txCoords) {
            console.log(`Texture not found for index ${nature}.`);
            return;
        }
        let offsetU; let offsetV;
        const rotate = nature === 1 && // grass
            Math.random() > 0.5;

        if (faceId < ijkS) // I
        {
            ii = faceId % iS;
            jj = (faceId - ii) % ijS  / iS; // [Info] % is prioritary over /
            kk = Math.floor(faceId / ijS);

            ax = iChunkOffset + 1 + ii; ay = jChunkOffset + jj; az = kChunkOffset + kk;

            bx = ax;    by = ay;        bz = az + 1;
            cx = ax;    cy = ay + 1;    cz = az + 1;
            dx = ax;    dy = ay + 1;    dz = az;

            if (rotate)
                this.setPNC1(positions, colors, normals, i, normal, color,
                    bx, by, bz, cx, cy, cz, dx, dy, dz,
                    pA, pB, pC, ab, cb,
                    iChunkOffset, jChunkOffset, kChunkOffset);
            else
                this.setPNC1(positions, colors, normals, i, normal, color,
                    ax, ay, az, bx, by, bz, cx, cy, cz,
                    pA, pB, pC, ab, cb,
                    iChunkOffset, jChunkOffset, kChunkOffset);

            // UVs H1
            offsetU = (normal ? txCoords[0][0] : txCoords[3][0]) * 0.0625;
            offsetV = (normal ? txCoords[0][1] : txCoords[3][1]) * 0.0625;
            uvs[uvi]     = offsetU + eps;
            uvs[uvi + 1] = offsetV + eps;
            uvs[uvi + 2] = offsetU + (normal ? eps : 0.0625 - eps);
            uvs[uvi + 3] = offsetV + 0.0625 - eps;
            uvs[uvi + 4] = offsetU + (normal ? 0.0625 - eps : eps);
            uvs[uvi + 5] = offsetV + 0.0625 - eps;

            if (rotate)
                this.setPNC2(positions, colors, normals, i, normal, color,
                    bx, by, bz, dx, dy, dz, ax, ay, az,
                    pA, pB, pC, ab, cb,
                    iChunkOffset, jChunkOffset, kChunkOffset);
            else
                this.setPNC2(positions, colors, normals, i, normal, color,
                    ax, ay, az, cx, cy, cz, dx, dy, dz,
                    pA, pB, pC, ab, cb,
                    iChunkOffset, jChunkOffset, kChunkOffset);

            // UVs H2
            uvs[uvi + 6]  = offsetU + eps;
            uvs[uvi + 7]  = offsetV + eps;
            uvs[uvi + 8]  = offsetU + 0.0625 - eps;
            uvs[uvi + 9]  = offsetV + (normal ? 0.0625 - eps : eps);
            uvs[uvi + 10] = offsetU + 0.0625 - eps;
            uvs[uvi + 11] = offsetV + (normal ? eps : 0.0625 - eps);
        }

        else if (faceId < 2 * ijkS) // J
        {
            faceId -= ijkS;
            ii = faceId % iS;
            jj = (faceId - ii) % ijS / iS; // % > /
            kk = Math.floor(faceId / ijS);

            ax = iChunkOffset + ii; ay = jChunkOffset + 1 + jj; az = kChunkOffset + kk;
            bx = ax + 1;    by = ay;    bz = az;
            cx = ax + 1;    cy = ay;    cz = az + 1;
            dx = ax;        dy = ay;    dz = az + 1;

            if (rotate)
                this.setPNC1(positions, colors, normals, i, normal, color,
                    bx, by, bz, cx, cy, cz, dx, dy, dz,
                    pA, pB, pC, ab, cb,
                    iChunkOffset, jChunkOffset, kChunkOffset);
            else
                this.setPNC1(positions, colors, normals, i, normal, color,
                    ax, ay, az, bx, by, bz, cx, cy, cz,
                    pA, pB, pC, ab, cb,
                    iChunkOffset, jChunkOffset, kChunkOffset);

            // UVs H1
            offsetU = (normal ? txCoords[1][0] : txCoords[4][0]) * 0.0625;
            offsetV = (normal ? txCoords[1][1] : txCoords[4][1]) * 0.0625;
            uvs[uvi]     = offsetU + (normal ? 0.0625 - eps : eps);
            uvs[uvi + 1] = offsetV + eps;
            uvs[uvi + 2] = offsetU + (normal ? eps : 0.0625 - eps);
            uvs[uvi + 3] = offsetV + (normal ? eps : 0.0625 - eps);
            uvs[uvi + 4] = offsetU + (normal ? eps : 0.0625 - eps);
            uvs[uvi + 5] = offsetV + (normal ? 0.0625 - eps : eps);

            if (rotate)
                this.setPNC2(positions, colors, normals, i, normal, color,
                    bx, by, bz, dx, dy, dz, ax, ay, az,
                    pA, pB, pC, ab, cb,
                    iChunkOffset, jChunkOffset, kChunkOffset);
            else
                this.setPNC2(positions, colors, normals, i, normal, color,
                    ax, ay, az, cx, cy, cz, dx, dy, dz,
                    pA, pB, pC, ab, cb,
                    iChunkOffset, jChunkOffset, kChunkOffset);

            // UVs H2
            uvs[uvi + 6]  = offsetU + (normal ? 0.0625 - eps : eps);
            uvs[uvi + 7]  = offsetV + eps;
            uvs[uvi + 8]  = offsetU + eps;
            uvs[uvi + 9]  = offsetV + 0.0625 - eps;
            uvs[uvi + 10] = offsetU + 0.0625 - eps;
            uvs[uvi + 11] = offsetV + 0.0625 - eps;
        }

        else // K
        {
            faceId -= 2 * ijkS;
            ii = faceId % iS;
            jj = (faceId - ii) % ijS  / iS; // % > /
            kk = Math.floor(faceId / ijS);

            ax = iChunkOffset + ii; ay = jChunkOffset + jj; az = kChunkOffset + 1 + kk;
            bx = ax;        by = ay + 1;    bz = az;
            cx = ax + 1;    cy = ay + 1;    cz = az;
            dx = ax + 1;    dy = ay;        dz = az;

            if (rotate)
                this.setPNC1(positions, colors, normals, i, normal, color,
                    bx, by, bz, cx, cy, cz, dx, dy, dz,
                    pA, pB, pC, ab, cb,
                    iChunkOffset, jChunkOffset, kChunkOffset);
            else
                this.setPNC1(positions, colors, normals, i, normal, color,
                    ax, ay, az, bx, by, bz, cx, cy, cz,
                    pA, pB, pC, ab, cb,
                    iChunkOffset, jChunkOffset, kChunkOffset);

            // UVs H1
            offsetU = (normal ? txCoords[2][0] : txCoords[5][0]) * 0.0625;
            offsetV = (normal ? txCoords[2][1] : txCoords[5][1]) * 0.0625;
            uvs[uvi]     = offsetU  + eps;
            uvs[uvi + 1] = offsetV + eps;
            uvs[uvi + 2] = offsetU + (normal ? eps : 0.0625 - eps);
            uvs[uvi + 3] = offsetV + 0.0625 - eps;
            uvs[uvi + 4] = offsetU + (normal ? 0.0625 - eps : eps);
            uvs[uvi + 5] = offsetV + 0.0625 - eps;

            if (rotate)
                this.setPNC2(positions, colors, normals, i, normal, color,
                    bx, by, bz, dx, dy, dz, ax, ay, az,
                    pA, pB, pC, ab, cb,
                    iChunkOffset, jChunkOffset, kChunkOffset);
            else
                this.setPNC2(positions, colors, normals, i, normal, color,
                    ax, ay, az, cx, cy, cz, dx, dy, dz,
                    pA, pB, pC, ab, cb,
                    iChunkOffset, jChunkOffset, kChunkOffset);

            // UVs H2
            uvs[uvi + 6]  = offsetU + eps;
            uvs[uvi + 7]  = offsetV + eps;
            uvs[uvi + 8]  = offsetU + 0.0625 - eps;
            uvs[uvi + 9]  = offsetV + (normal ? 0.0625 - eps : eps);
            uvs[uvi + 10] = offsetU + 0.0625 - eps;
            uvs[uvi + 11] = offsetV + (normal ? eps : 0.0625 - eps);
        }

        for (j = 0; j < 18; ++j) {
            if (isNaN(positions[i + j])) {
                console.log(`Transferred miscalculation on ${i}th component.` +
                    `\tnormal: ${normal}\n` +
                    `\tfaceId: ${faceId}`
                );
                return;
            }
        }
    }

};

export { FacesModule };
