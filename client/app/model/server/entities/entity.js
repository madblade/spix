'use strict';

import extend           from '../../../extend.js';
import { Vector3 } from 'three';

let Entity = function(graphicalComponent, worldId)
{
    this.graphicalComponent = graphicalComponent;
    this.worldId = worldId;

    // Interpolation routines
    this.lastPFromServer = new Vector3(0, 0, 0);
    this.currentPFromServer = new Vector3(0, 0, 0);
    this.interpolatingP = new Vector3(0, 0, 0);
    this.needsUpdate = false;
    this.lastRFromServer = new Vector3(0, 0, 0);
    this.currentRFromServer = new Vector3(0, 0, 0);
    this.interpolatingR = new Vector3(0, 0, 0);
};

extend(Entity.prototype, {

    getObject3D() {
        return this.graphicalComponent;
    },

    getWorldId() {
        return this.worldId;
    },

    setWorldId(worldId) {
        this.worldId = worldId;
    }

});

export { Entity };
