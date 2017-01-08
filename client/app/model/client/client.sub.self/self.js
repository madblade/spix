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

    this.clickInteraction = 'block';

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
        if (!type) return;
        switch (type) {
            case 'interaction':
                var avatar = serverSelfModel.avatar;
                var worldId = serverSelfModel.worldId;
                var display = !serverSelfModel.displayAvatar;
                serverSelfModel.displayAvatar = display;

                if (display)    scope._cameraInteraction = 'third-person';
                else            scope._cameraInteraction = 'first-person';

                graphicsEngine.changeAvatarVisibility(display, avatar, worldId);
                break;
            default:
                break;
        }
    });

    this.changes = [];
};

