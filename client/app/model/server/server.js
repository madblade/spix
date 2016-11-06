/**
 * Contains game-specific data structures.
 */

'use strict';

App.Model.Game = function(app) {
    this.app = app;

    this.position = [];
    this.rotation = [];
    this.entities = [];

    this.isRunning = false;
};

App.Model.Game.prototype.run = function() {
    this.isRunning = true;
    console.log('Game effectively started.');
};

App.Model.Game.prototype.updateChunks = function(data) {
    if (!this.isRunning) return;
    //data = JSON.parse(data);

    this.app.engine.graphics.updateGraphicChunks(data);
};

App.Model.Game.prototype.updateEntities = function(data) {
    if (!this.isRunning) return;

    data = JSON.parse(data);
    this.position = data[0];
    this.rotation = data[1];
    this.entities = data[2];

    // TODO decouple
    this.app.engine.graphics.updateGraphicEntities(this.position, this.rotation, this.entities);
};

App.Model.Game.prototype.endGame = function() {

};
