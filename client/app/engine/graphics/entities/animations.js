/**
 *
 */

'use strict';

let AnimationsModule = {

    initializeAnimations() {
        this.prevTime = Date.now();
        this.mixers = new Map();
    },

    updateAnimation(entityId) {
        let mixer = this.mixers.get(entityId);
        if (mixer !== undefined) {
            let time = Date.now();
            mixer.update((time - this.prevTime) * 0.001);
            this.prevTime = time;
        }
    }

};

export { AnimationsModule };
