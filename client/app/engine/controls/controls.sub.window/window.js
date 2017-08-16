/**
 *
 */

'use strict';

// Legacy
extend(App.Engine.UI.prototype, {
    
    setupWindowListeners: function() {
        
        var visibilityChange;
        var hidden;
        if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support 
            hidden = "hidden";
            visibilityChange = "visibilitychange";
        } else if (typeof document.msHidden !== "undefined") {
            hidden = "msHidden";
            visibilityChange = "msvisibilitychange";
        } else if (typeof document.webkitHidden !== "undefined") {
            hidden = "webkitHidden";
            visibilityChange = "webkitvisibilitychange";
        } else {
            console.log("Visibility change API not supported!");
            console.log("Rolling back - using Alt-Tab, Ctrl-Tab or the likes may " +
                "result in focus-state bugs (rejoin to cancel if any).");
            return;
        }
        
        var handlerVisibilityChange = function() {
            if (document[hidden]) {
                this.stopKeyboardListeners();
            } else {
                this.startKeyboardListeners();
            }
        };
        
        this.windowListeners = {
            start: function() {
                document.addEventListener(visibilityChange, handlerVisibilityChange, false)
            },
            stop: function() {
                document.removeEventListener(visibilityChange, handlerVisibilityChange)
            }
        };
    },

    startWindowListeners: function() {
        this.windowListeners.start();
    },

    stopWindowListeners: function() {
        this.windowListeners.stop();
    }
    
});