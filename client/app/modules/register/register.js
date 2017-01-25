/**
 *
 */

'use strict';

App.Modules.Register = function(app) {
    this.modules = {};
};

extend(App.Modules.Register.prototype, {

    registerDefaultModules: function() {
        this.registerModule('chat', new App.Modules.Chat(this));
        this.registerModule('hud', new App.Modules.Hud(this));
    },

    registerModule: function(moduleName, module) {
        if (this.modules.hasOwnProperty(moduleName)) {
            throw "Error: module already registered.";
        }

        this.modules[moduleName] = module;
    },

    updateSelfState: function(data) {
        this.modules['hud'].updateSelfState(data);
    },

    updateChat: function(data) {
        this.modules['chat'].updateChat(data);
    },

    sendMessage: function(message) {
        console.log('Sending message.');
    }

});
