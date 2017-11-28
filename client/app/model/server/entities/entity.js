'use strict';

import extend           from '../../../extend.js';

var Entity = function(graphicalComponent, worldId) {
    this.graphicalComponent = graphicalComponent;
    this.worldId = worldId;
};

extend(Entity.prototype, {

    getObject3D: function() {
        return this.graphicalComponent;
    },

    getWorldId: function() {
        return this.worldId;
    },

    setWorldId: function(worldId) {
        this.worldId = worldId;
    }

});

export { Entity };
