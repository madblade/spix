/**
 *
 */

'use strict';

App.Model.Client.SelfComponent = function(clientModel) {
    this.clientModel = clientModel;

    // Model.
    this._cameraInteraction = 'first-person';
    this.cameraInteraction = {
        isFirstPerson: function() { return this._cameraInteraction === 'first-person'; }.bind(this),
        isThirdPerson: function() { return this._cameraInteraction === 'third-person'; }.bind(this)
    };

    this._clickInteraction = 'block';
    this.clickInteraction = {
        isBlock: function() { return this._clickInteraction === 'block' }.bind(this),
        isX: function() { return this._clickInteraction === 'x' }.bind(this)
    };

    // Changes.
    this.changes = [];
};

App.Model.Client.SelfComponent.prototype.triggerChange = function(type, data) {
    this.changes.push([type, data]);
};

App.Model.Client.SelfComponent.prototype.processChanges = function() {
    var changes = this.changes;
    if (changes.length < 1) return;

    var scope = this;
    var serverSelfModel = this.clientModel.app.model.server.selfModel;
    var graphicsEngine = this.clientModel.app.engine.graphics;

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
                if (data === 'toggle')
                    display = !serverSelfModel.displayAvatar;
                else
                    display = data;

                serverSelfModel.displayAvatar = display;

                if (display)
                    scope._cameraInteraction = 'third-person';
                else
                    scope._cameraInteraction = 'first-person';

                graphicsEngine.changeAvatarVisibility(display, avatar, worldId);
                break;

            case 'interaction':
                if (scope._clickInteraction === 'block') {
                    scope._clickInteraction = 'x';
                } else if (scope._clickInteraction === 'x') {
                    scope._clickInteraction = 'block';
                }

                break;

            default:
                break;
        }
    });

    this.changes = [];
};

