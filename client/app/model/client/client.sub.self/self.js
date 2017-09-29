/**
 *
 */

'use strict';

App.Model.Client.SelfComponent = function(clientModel) {
    this.clientModel = clientModel;

    /** Model **/

    // Camera.
    this._cameraInteraction = 'first-person';
    this.cameraInteraction = {
        isFirstPerson: function() { return this._cameraInteraction === 'first-person'; }.bind(this),
        isThirdPerson: function() { return this._cameraInteraction === 'third-person'; }.bind(this)
    };

    // Selected action.
    this._clickInteraction = 'block';
    this.clickInteraction = {
        isBlock: function() { return this._clickInteraction === 'block' }.bind(this),
        isX: function() { return this._clickInteraction === 'x' }.bind(this)
    };

    // Inventory.
    this.currentItem = 0; // Index of current item in inventory.
    this._itemOrientations = [0, 1]; // In case of ambiguity.
    this._itemOrientation = this._itemOrientations[0];
    this._itemPlacementRatio = 0;
    this._itemOffset = 0.999;

    /** Dynamic **/

    // Buffer filled by engine->controls.
    this.changes = [];
};


extend(App.Model.Client.SelfComponent.prototype, {

    init: function() {
        register.updateSelfState({'active_item': this._clickInteraction});
        register.updateSelfState({'item_orientation': this._itemOrientation});
        register.updateSelfState({'item_offset': this._itemOffset});
    },

    // TODO [MEDIUM] implement items
    getCurrentItem: function() {
        return this.currentItem;
    },
    
    getItemOrientation: function() {
        return this._itemOrientation;
    },
    
    getItemOffset: function() {
        return this._itemOffset;
    },

    triggerChange: function(type, data) {
        this.changes.push([type, data]);
    },

    processChanges: function() {
        var changes = this.changes;
        if (changes.length < 1) return;

        var scope = this;
        var serverSelfModel = this.clientModel.app.model.server.selfModel;
        var graphicsEngine = this.clientModel.app.engine.graphics;
        var register = this.clientModel.app.register;

        // ENHANCEMENT [LOW]: filter & simplify
        changes.forEach(function(event) {
            var type = event[0];
            var data = event[1];
            if (!type || !data) return;
            switch (type) {
                case 'camera-update':
                    console.log('update camera');
                    graphicsEngine.cameraManager.moveCameraFromMouse(0, 0, 0, 0);
                    break;
                case 'camera':
                    var avatar = serverSelfModel.avatar;
                    var worldId = serverSelfModel.worldId;
                    var display;
                    if (data[0] === 'toggle')
                        display = !serverSelfModel.displayAvatar;
                    else
                        display = false;

                    serverSelfModel.displayAvatar = display;

                    if (display)
                        scope._cameraInteraction = 'third-person';
                    else
                        scope._cameraInteraction = 'first-person';

                    graphicsEngine.changeAvatarVisibility(display, avatar, worldId);
                    graphicsEngine.cameraManager.updateCameraPosition(serverSelfModel.position);
                    break;

                case 'interaction':
                    var actionType = data[0];
                    if (actionType === 'toggle') {
                        if (scope._clickInteraction === 'block') {
                            scope._clickInteraction = 'x';
                        } else if (scope._clickInteraction === 'x') {
                            scope._clickInteraction = 'block';
                        }
                        register.updateSelfState({'active_item': scope._clickInteraction});
                    } else if (actionType === 'item_orientation') {
                        var newOrientation = scope._itemOrientation;
                        var orientations = scope._itemOrientations;
                        var newOrientationId = orientations.indexOf(newOrientation);
                        var nbOrientations = orientations.length;
                        newOrientationId++; newOrientationId%=nbOrientations;
                        scope._itemOrientation = orientations[newOrientationId];
                        
                        register.updateSelfState({'item_orientation': scope._itemOrientation});
                    } else if (actionType === 'item_offset') {
                        var deltaY = data[1];
                        var offset = Number(scope._itemOffset);
                        var d = Math.abs(deltaY);
                        if (deltaY>0) { // Previous
                            scope._itemOffset = Math.min(offset+(d/100), 0.999).toFixed(3);
                        } else if (deltaY<0) { // Next
                            scope._itemOffset = Math.max(offset-(d/100), 0.001).toFixed(3);
                        }
                        
                        register.updateSelfState({'item_offset': scope._itemOffset});
                    }

                    break;

                default:
                    break;
            }
        });

        this.changes = [];
    }

});
