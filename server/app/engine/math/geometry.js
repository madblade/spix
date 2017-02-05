/**
 *
 */

'use strict';

class GeometryUtils {

    /** Common topology distances **/

    static infiniteNormDistance(pos1, pos2) {
        var d = 0;
        for (let i = 0; i < 3; ++i)
            d = Math.max(d, Math.abs(parseInt(pos1[i]) - parseInt(pos2[i])));
        return d;
    };

    static chunkSquaredEuclideanDistance(pos1, pos2) {
        let result = 0, d;
        for (let i = 0; i<3; ++i) { d = pos1[i]-pos2[i]; result += d*d; }
        return result;
    };

    static entitySquaredTransEuclideanDistance(entityX, entityY) {
        // Every world is a parallel leaf.
        let result = 0; let d;
        let pX = entityX.position, pY = entityY.position;
        for (let i = 0; i<3; ++i) { d = pX[i]-pY[i]; result += d*d; }
        return result;
    }

    static entitySquaredEuclideanDistance(entityX, entityY) {
        // Two entities on different worlds are considered infinitely far.
        if (entityX.worldId !== entityY.worldId) return Number.POSITIVE_INFINITY;

        // Else return regular Euclidean distance.
        let result = 0; let d;
        let pX = entityX.position, pY = entityY.position;
        for (let i = 0; i<3; ++i) { d = pX[i]-pY[i]; result += d*d; }
        return result;
    };

    static euclideanDistance3(v1, v2) {
        let x = v1[0]-v2[0]; x*=x;
        let y = v1[1]-v2[1]; y*=y;
        let z = v1[2]-v2[2]; z*=z;
        return Math.sqrt(x+y+z);
    }

}

export default GeometryUtils;
