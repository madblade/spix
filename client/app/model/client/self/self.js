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

    this.currentItemSlot = 0; // Index of current item in inventory.
    this.angleFromIntersectionPoint = 0; // For portal placement.

    let emptyItem  = ItemType.NONE;
    this.quickBarSize = 8;
    this.quickBar = [ // Default demo items
        ItemType.BLOCK_PLANKS,
        ItemType.KATANA,
        ItemType.YUMI,
        ItemType.PORTAL_GUN_SINGLE,
        ItemType.PORTAL_GUN_DOUBLE,
        emptyItem, emptyItem, emptyItem
    ];

    // Dynamic.

    // Buffer filled by engine->controls.
    this.changes = [];

    // Deprecated
    // LEGACY (should NOT be used)
    this._itemOrientations = [0, 1];
    this._itemOrientation = this._itemOrientations[0];
    this._itemPlacementRatio = 0;
    this._itemOffset = 0.999;
};


extend(SelfComponent.prototype, {

    init() {
        let register = this.clientModel.app.register;
        register.updateSelfState({itemSelected: this.currentItemSlot});
        // register.updateSelfState({itemOrientation: this._itemOrientation});
        // register.updateSelfState({itemOffset: this._itemOffset});
    },

    getCurrentItemID() {
        return this.quickBar[this.currentItemSlot];
    },

    // Deprecated -> Removed.
    // getCurrentItem() {
    //     return this.currentItem;
    // },
    // getItemOrientation() {
    //     return this._itemOrientation;
    // },

    setAngleFromIntersectionPoint(angle) {
        this.angleFromIntersectionPoint = angle;
    },

    getAngleFromIntersectionPoint() {
        return this.angleFromIntersectionPoint;
    },

    /**
     * @deprecated
     */
    getItemOffset() {
        return this._itemOffset;
    },

    triggerChange(type, data) {
        this.changes.push([type, data]);
    },

    processChanges() {
        let changes = this.changes;
        if (changes.length < 1) return;

        let serverSelfModel = this.clientModel.app.model.server.selfModel;
        let graphicsEngine = this.clientModel.app.engine.graphics;

        // ENHANCEMENT [LOW]: filter & simplify
        changes.forEach(event => {
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
                        this._cameraInteraction = 'third-person';
                    else
                        this._cameraInteraction = 'first-person';

                    graphicsEngine.changeAvatarVisibility(display, avatar, worldId);
                    graphicsEngine.cameraManager.updateCameraPosition(serverSelfModel.position);
                    break;

                case 'interaction':
                    this.processInteractionChange(data);
                    break;

                default:
                    break;
            }
        });

        this.changes = [];
    },

    processInteractionChange(data)
    {
        let register = this.clientModel.app.register;
        let actionType = data[0];
        // if (actionType === 'toggle')
        // {
        // if (scope._clickInteraction === 'block') {
        //     scope._clickInteraction = 'x';
        // } else if (scope._clickInteraction === 'x') {
        //     scope._clickInteraction = 'block';
        // }
        // register.updateSelfState({activeItem: scope._clickInteraction});
        // }
        // else if (actionType === 'itemOrientation')
        // {
        // let newOrientation = scope._itemOrientation;
        // let orientations = scope._itemOrientations;
        // let newOrientationId = orientations.indexOf(newOrientation);
        // let nbOrientations = orientations.length;
        // newOrientationId++;
        // newOrientationId %= nbOrientations;
        // scope._itemOrientation = orientations[newOrientationId];

        // register.updateSelfState({itemOrientation: scope._itemOrientation});
        // }
        // else
        if (actionType === 'itemSelect')
        {
            const deltaY = data[1];
            let currentItemSlot = this.currentItemSlot;
            const oldItemSlot = currentItemSlot;
            const quickBarSize = this.quickBarSize;

            if (deltaY > 0) { // Previous
                currentItemSlot--;
                if (currentItemSlot < 0) currentItemSlot = quickBarSize - 1;
            } else if (deltaY < 0) { // Next
                currentItemSlot++;
                currentItemSlot %= quickBarSize;
            }

            this.currentItemSlot = currentItemSlot;

            // TODO graphics change mesh.

            register.updateSelfState({
                itemSelect: [currentItemSlot, oldItemSlot]
            });
        }
    }

});

export { SelfComponent };
