/**
 *
 */

'use strict';

import extend           from '../../extend.js';
import { Chat }         from '../chat/chat.js';
import { Hud }          from '../hud/hud.js';

var Register = function(/*app*/) {
    this.modules = {};
};

extend(Register.prototype, {

    registerDefaultModules: function() {
        this.registerModule('chat', new Chat(this));
        this.registerModule('hud', new Hud(this));
    },

    registerModule: function(moduleName, module) {
        if (this.modules.hasOwnProperty(moduleName)) {
            throw Error('Error: module already registered.');
        }

        this.modules[moduleName] = module;
    },

    updateSelfState: function(data) {
        this.modules.hud.updateSelfState(data);
    },

    updateChat: function(data) {
        this.modules.chat.updateChat(data);
    },

    sendMessage: function(/*message*/) {
        console.log('Sending message.');
    }

});

export { Register };
