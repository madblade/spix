/**
 *
 */

'use strict';

class TerrainCollider {

    /**
     * @returns 'has collided'
     */
    static linearCollide(entity, WM, newPosition) {
        // TODO collide world.
        if (!WM.isFree(newPosition)) {
            // console.log("Collision detected @ " + Math.round(newPosition[0]*10)/10 + ', ' +
            //    Math.round(newPosition[1]*10)/10 + ', ' + Math.round(newPosition[2]*10)/10 + ', ');
            for (let i = 0; i<3; ++i) entity.speed[i] = -entity.speed[i]-entity._impulseSpeed[i];
            return true;
        }

        // Update entity position.
        entity.position = newPosition;
        return false;
    }

}

export default TerrainCollider;
