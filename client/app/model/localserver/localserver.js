/**
 * Keeps track of distant users that can connect to the local server.
 * Used when the local server is running.
 */

'use strict';

import extend       from '../../extend.js';

let LocalServer = function(app) {
    this.app = app;
    this.users = new Map();
};

extend(LocalServer.prototype, {

    hasUser(userID) {
        return this.users.has(userID);
    },

    addUser(userID) {
        this.users.set(userID, {
            offer: '',
            answer: '',
            inboundConnection: null,
            inboundChannel: null
        });
    },

    // Server offer
    addOffer(userID, offer) {
        let user = this.users.get(userID);
        if (!user) {
            this.users.set(userID, {
                offer,
                answer: '',
                inboundConnection: null,
                inboundChannel: null
            });
        } else {
            user.offer = offer;
        }
    },

    // Client answer
    addAnswer(userID, answer) {
        let user = this.users.get(userID);
        if (!user) {
            console.error(`[Model/LocalServer] User "${userID}" not found.`);
            return;
        }
        user.answer = answer;
    }

});

export { LocalServer };
