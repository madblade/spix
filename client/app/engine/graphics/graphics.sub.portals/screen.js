/**
 * Screen object (graphical component of a portal).
 */

'use strict';

App.Engine.Graphics.Screen = function(screenId, mesh, renderTarget, worldId) {
    this.screenId = screenId;
    this.mesh = mesh;
    this.renderTarget = renderTarget;
    this.worldId = worldId;
    this.otherWorldId = null;
};

extend(App.Engine.Graphics.Screen.prototype, {

    getId: function() {
        return this.screenId;
    },

    getMesh: function() {
        return this.mesh;
    },

    getRenderTarget: function() {
        return this.renderTarget;
    },

    getWorldId: function() {
        return this.worldId;
    },

    getOtherWorldId: function() {
        return this.otherWorldId;
    },

    setOtherWorldId: function(otherWorldId) {
        this.otherWorldId = otherWorldId;
    },

    isLinked: function() {
        return (this.otherWorldId !== null || this.otherWorldId !== undefined);
    }

});
