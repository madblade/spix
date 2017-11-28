'use strict';

import extend           from '../../../extend.js';

let Entity = function(graphicalComponent, worldId) {
    this.graphicalComponent = graphicalComponent;
    this.worldId = worldId;
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
