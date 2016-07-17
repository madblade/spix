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
        let worldManager = this._worldman;
        entityManager.forEach(function(entity) {
           entity.move(entityManager, worldManager);
        });
    }

}

export default Physics;
