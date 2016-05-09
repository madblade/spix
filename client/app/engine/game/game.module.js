/**
 * Contains game-specific data structures.
 */

'use strict';

App.Engine.Game = function() {
    this.chunks = [];
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
        this.chunks = data[0];
        this.blocks = data[1];
        this.entities = data[2];
        console.log('updated world');
    }
};
