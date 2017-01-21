/**
 *
 */

'use strict';

App.Modules.Register = function(app) {
    this.modules = {};
};

App.Modules.Register.prototype.registerDefaultModules = function() {
    this.registerModule('chat', new App.Modules.Chat(this));
    this.registerModule('hud', new App.Modules.Hud(this));
};

App.Modules.Register.prototype.registerModule = function(moduleName, module) {
    if (this.modules.hasOwnProperty(moduleName)) {
        throw "Error: module already registered.";
    }

    this.modules[moduleName] = module;
};

App.Modules.Register.prototype.updateSelfState = function(data) {
    this.modules['hud'].updateSelfState(data);
};

App.Modules.Register.prototype.updateChat = function(data) {
    this.modules['chat'].updateChat(data);
};

App.Modules.Register.prototype.sendMessage = function(message) {
    console.log('Sending message.');
};
