/**
 *
 */

'use strict';

import extend           from '../../extend.js';
import { Chat }         from '../chat/chat.js';
import { Hud }          from '../hud/hud.js';

let Register = function() //, app
{
    this.modules = {};
};

extend(Register.prototype, {

    registerDefaultModules()
    {
        this.registerModule('chat', new Chat(this));
        this.registerModule('hud', new Hud(this));
    },

    registerModule(moduleName, module)
    {
        if (this.modules.hasOwnProperty(moduleName)) {
            throw Error('Error: module already registered.');
        }

        this.modules[moduleName] = module;
    },

    gameStarted()
    {
        for (let m in this.modules) {
            if (!this.modules.hasOwnProperty(m)) continue;
            let module = this.modules[m];
            if (typeof module.initModule === 'function')
            {
                module.initModule();
            }
        }
    },

    gameStopped()
    {
        for (let m in this.modules) {
            if (!this.modules.hasOwnProperty(m)) continue;
            let module = this.modules[m];
            if (typeof module.disposeModule === 'function')
            {
                module.disposeModule();
            }
        }
    },

    updateSelfState(data)
    {
        this.modules.hud.updateSelfState(data);
    },

    updateChat(data)
    {
        this.modules.chat.updateChat(data);
    },

    sendMessage() // message
    {
        console.log('Sending message.');
    }

});

export { Register };
