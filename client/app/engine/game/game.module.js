/**
 * Contains game-specific data structures.
 */

'use strict';

App.Engine.Game = function(app) {
    this.app = app;

    this.position = [];
    this.blocks = [];
    this.entities = [];

    this.isRunning = false;
};

App.Engine.Game.prototype.run = function() {
    this.isRunning = true;
    console.log('Game effectively started.');
};

App.Engine.Game.prototype.update = function(data) {
    if (this.isRunning) {
        this.position = data[0];
        this.blocks = data[1];
        this.entities = data[2];
        this.updateGraphics(this.position, this.blocks, this.entities);
    }
};

App.Engine.Game.prototype.updateGraphics = function(c, b, e) {
    this.app.graphicsEngine.update(c, b, e);
};
