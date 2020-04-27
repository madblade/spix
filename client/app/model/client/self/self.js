/**
 *
 */

'use strict';

import extend       from '../../../extend.js';
import { ItemType } from '../../server/self/items';

let SelfComponent = function(clientModel) {
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
        isBlock: function() { return this._clickInteraction === 'block'; }.bind(this),
        isX: function() { return this._clickInteraction === 'x'; }.bind(this)
    };

    // Inventory.
    this.currentItem = 0; // Index of current item in inventory.
    this._itemOrientations = [0, 1]; // In case of ambiguity.
    this._itemOrientation = this._itemOrientations[0];
    this._itemPlacementRatio = 0;
    this._itemOffset = 0.999;
    this._angleFromIntersectionPoint = 0;

    let emptyItem  = ItemType.NONE;
    this._quickBar = [
        emptyItem, emptyItem, emptyItem, emptyItem,
        emptyItem, emptyItem, emptyItem, emptyItem
    ];

    /** Dynamic **/

    // Buffer filled by engine->controls.
    this.changes = [];
};


extend(SelfComponent.prototype, {

    init() {
        let register = this.clientModel.app.register;
        register.updateSelfState({activeItem: this._clickInteraction});
        register.updateSelfState({itemOrientation: this._itemOrientation});
        register.updateSelfState({itemOffset: this._itemOffset});
    },

    // TODO [MEDIUM] implement items
    getCurrentItem() {
        return this.currentItem;
    },

    getItemOrientation() {
        return this._itemOrientation;
    },

    setAngleFromIntersectionPoint(angle) {
        this._angleFromIntersectionPoint = angle;
    },

    getAngleFromIntersectionPoint() {
        return this._angleFromIntersectionPoint;
    },

    getItemOffset() {
        return this._itemOffset;
    },

    triggerChange(type, data) {
        this.changes.push([type, data]);
    },

    processChanges() {
        let changes = this.changes;
        if (changes.length < 1) return;

        let scope = this;
        let serverSelfModel = this.clientModel.app.model.server.selfModel;
        let graphicsEngine = this.clientModel.app.engine.graphics;
        let register = this.clientModel.app.register;

        // ENHANCEMENT [LOW]: filter & simplify
        changes.forEach(function(event) {
            let type = event[0];
            let data = event[1];
            if (!type || !data) return;
            switch (type) {
                case 'camera-update':
                    // TODO [LOW] only once per iteration.
                    //console.log('camera autoupdate');
                    //graphicsEngine.cameraManager.updateCameraPosition(data);
                    graphicsEngine.cameraManager.moveCameraFromMouse(0, 0, 0, 0);
                    break;
                case 'camera':
                    let avatar = serverSelfModel.avatar;
                    let worldId = serverSelfModel.worldId;
                    let display;
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
                    let actionType = data[0];
                    if (actionType === 'toggle') {
                        if (scope._clickInteraction === 'block') {
                            scope._clickInteraction = 'x';
                        } else if (scope._clickInteraction === 'x') {
                            scope._clickInteraction = 'block';
                        }
                        register.updateSelfState({activeItem: scope._clickInteraction});
                    } else if (actionType === 'itemOrientation') {
                        let newOrientation = scope._itemOrientation;
                        let orientations = scope._itemOrientations;
                        let newOrientationId = orientations.indexOf(newOrientation);
                        let nbOrientations = orientations.length;
                        newOrientationId++; newOrientationId %= nbOrientations;
                        scope._itemOrientation = orientations[newOrientationId];

                        register.updateSelfState({itemOrientation: scope._itemOrientation});
                    } else if (actionType === 'itemOffset') {
                        let deltaY = data[1];
                        let offset = Number(scope._itemOffset);
                        let d = Math.abs(deltaY);
                        if (deltaY > 0) { // Previous
                            scope._itemOffset = Math.min(offset + d / 100, 0.999).toFixed(3);
                        } else if (deltaY < 0) { // Next
                            scope._itemOffset = Math.max(offset - d / 100, 0.001).toFixed(3);
                        }

                        register.updateSelfState({itemOffset: scope._itemOffset});
                    }

                    break;

                default:
                    break;
            }
        });

        this.changes = [];
    }

});

export { SelfComponent };
