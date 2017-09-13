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

    /** Dynamic **/

    // Buffer filled by engine->controls.
    this.changes = [];
};


extend(App.Model.Client.SelfComponent.prototype, {

    init: function() {
        register.updateSelfState({'active_item': this._clickInteraction});
    },

    // TODO [MEDIUM] implement items
    getCurrentItem: function() {
        return this.currentItem;
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
                    } else if (actionType === 'item') {
                        var deltaY = data[1];
                        if (deltaY>0) {
                            // Previous
                        } else if (deltaY<0) {
                            // Next
                        }
                        register.updateSelfState({'active_item': scope._clickInteraction});
                    }

                    break;

                default:
                    break;
            }
        });

        this.changes = [];
    }

});
