/**
 * Middleware for client I/O and prediction in high-latency networks
 */

// TODO
//  1. client/server lockstep (lan)
//  2. client standalone lockstep accepting webrtc
//  3. (this) client/server selfpos model

let Middleware = function(app) {
    this.app = app;
};

export { Middleware };
