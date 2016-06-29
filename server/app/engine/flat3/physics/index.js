/**
 *
 */

'use strict';

class Physics {

    constructor(entityman, worldman) {
        this._entityman = entityman;
        this._worldman = worldman;
    }

    update() {
        let entityManager = this._entityman;
        entityManager.forEach(function(entity) {
           entity.move(entityManager);
        });
    }

}

export default Physics;
