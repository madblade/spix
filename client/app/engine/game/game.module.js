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

App.Engine.Game.prototype.updateChunks = function(data) {
    // TODO manage asynch with a flag?
    if (!this.isRunning) return;

    this.blocks = data;
    this.app.graphicsEngine.updateGraphicChunks(this.blocks);
};

App.Engine.Game.prototype.updateEntities = function(data) {
    if (!this.isRunning) return;

    this.position = data[0];
    this.rotation = data[1];
    this.entities = data[2];
    this.app.graphicsEngine.updateGraphicEntities(this.position, this.rotation, this.entities);
};

App.Engine.Game.prototype.endGame = function() {

};
