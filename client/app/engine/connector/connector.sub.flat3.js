/**
 *
 */

'use strict';

App.Engine.Connection.prototype.registerSocketForFlat3 = function() {
    this.addCustomListener('stamp', app.gameEngine.update);
    this.addCustomListener('chat', function(data) {console.log(data)});
};
