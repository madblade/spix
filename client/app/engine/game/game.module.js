/**
 * Contains game-specific data structures.
 */

'use strict';

App.Engine.Game = function(app) {
    this.app = app;

    this.position = [];
    this.rotation = [];
    this.entities = [];

    this.isRunning = false;
};

App.Engine.Game.prototype.run = function() {
    this.isRunning = true;
    console.log('Game effectively started.');
};

App.Engine.Game.prototype.updateChunks = function(data) {
    if (!this.isRunning) return;

    this.app.graphicsEngine.updateGraphicChunks(data);
};

App.Engine.Game.prototype.updateEntities = function(data) {
    if (!this.isRunning) return;

    data = JSON.parse(data);
    this.position = data[0];
    this.rotation = data[1];
    this.entities = data[2];
    this.app.graphicsEngine.updateGraphicEntities(this.position, this.rotation, this.entities);
};

App.Engine.Game.prototype.endGame = function() {

};
