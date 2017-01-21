/**
 * Screen object (graphical component of a portal).
 */

'use strict';

App.Engine.Graphics.Screen = function(screenId, mesh, renderTarget) {
    this.screenId = screenId;
    this.mesh = mesh;
    this.renderTarget = renderTarget;
    this.otherWorldId = null;
};

App.Engine.Graphics.Screen.prototype.getId = function() {
    return this.screenId;
};

App.Engine.Graphics.Screen.prototype.getMesh = function() {
    return this.mesh;
};

App.Engine.Graphics.Screen.prototype.getRenderTarget = function() {
    return this.renderTarget;
};

App.Engine.Graphics.Screen.prototype.getOtherWorldId = function() {
    return this.otherWorldId;
};

App.Engine.Graphics.Screen.prototype.setOtherWorldId = function(otherWorldId) {
    this.otherWorldId = otherWorldId;
};

App.Engine.Graphics.Screen.prototype.isLinked = function() {
    return (this.otherWorldId !== null || this.otherWorldId !== undefined);
};
