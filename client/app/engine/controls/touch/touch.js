/**
 *
 */

'use strict';

App.Engine.UI.prototype.setupTouch = function() {
    var startX,
        startY,
        dX, dY, daX, daY,
        threshold = 150, // Required min distance traveled to be considered swipe.
        allowedTime = 250, // Maximum time allowed to travel that distance.
        elapsedTime,
        startTime;

    // this.startTouchListeners();
};

App.Engine.UI.prototype.startTouchListeners = function() {
    this.registerTouch();
};

App.Engine.UI.prototype.stopKeyboardListeners = function() {
    this.unregisterTouch();
};
