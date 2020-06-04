/**
 *
 */

'use strict';

let AnimationsModule = {

    initializeAnimations()
    {
        // TODO [ANIMATION] different time for each animation
        this.prevTime = Date.now();
        this.mixers = new Map();
    },

    updateAnimation(entityId)
    {
        let mixer = this.mixers.get(entityId);
        if (mixer) {
            let time = Date.now();
            mixer.update((time - this.prevTime) * 0.001);
            this.prevTime = time;
        } else {
            console.log('[Animations] Undefined mixer.');
        }
    }

};

export { AnimationsModule };
