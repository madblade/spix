/**
 *
 */

'use strict';

App.Engine.UI.prototype.setupCustom = function(layout) {
    if (typeof layout === 'string') return;
    this.keys = layout;
};
