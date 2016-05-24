/**
 * Contains game-specific data structures.
 */

'use strict';

App.Engine.Game = function(app) {
    this.app = app;

    this.position = [];
    this.rotation = [];
    this.blocks = [];
    this.entities = [];

    this.isRunning = false;
};

App.Engine.Game.prototype.run = function() {
    this.isRunning = true;
    console.log('Game effectively started.');
};

App.Engine.Game.prototype.update = function(data) {
    // TODO manage asynch with a flag?
    if (this.isRunning) {
        this.position = data[0];
        this.rotation = data[1];
        this.blocks = data[2];
        this.entities = data[3];
        this.updateGraphics(this.position, this.rotation, this.blocks, this.entities);
    }
};

App.Engine.Game.prototype.updateGraphics = function(c, r, b, e) {
    this.app.graphicsEngine.update(c, r, b, e);
};
