'use strict';

App.Model.Server.EntityModel.Entity = function(graphicalComponent, worldId) {

    this.graphicalComponent = graphicalComponent;
    this.worldId = worldId;

};

extend(App.Model.Server.EntityModel.Entity.prototype, {

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
