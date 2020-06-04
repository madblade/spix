/**
 * Screen object (graphical component of a portal).
 */

'use strict';

import extend from '../../../extend.js';

let Screen = function(screenId, mesh, renderTarget, worldId)
{
    this.screenId = screenId;
    this.mesh = mesh;
    this.renderTarget = renderTarget;
    this.worldId = worldId;
    this.otherWorldId = null;

    // A screen may be rendered with several cameras depending of
    // the 'multiverse topology' and position of the player.
    this.cameras = new Set();
};

extend(Screen.prototype, {

    getId()
    {
        return this.screenId;
    },

    getMesh()
    {
        return this.mesh;
    },

    getRenderTarget()
    {
        return this.renderTarget;
    },

    getWorldId()
    {
        return this.worldId;
    },

    getOtherWorldId()
    {
        return this.otherWorldId;
    },

    setOtherWorldId(otherWorldId)
    {
        this.otherWorldId = otherWorldId;
    },

    isLinked()
    {
        return this.otherWorldId !== null || this.otherWorldId !== undefined;
    }

});

export { Screen };
