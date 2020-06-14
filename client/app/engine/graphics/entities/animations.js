/**
 *
 */

'use strict';

let AnimationsModule = {

    initializeAnimations()
    {
        this.mixers = new Map();
        this.times = new Map();
        this.clips = new Map();
    },

    updateAnimation(entityId)
    {
        let mixer = this.mixers.get(entityId);
        let prevTime = this.times.get(entityId);
        if (mixer) {
            let time = Date.now();
            mixer.update((time - prevTime) * 0.001);
            this.times.set(entityId, time);
        } else {
            // console.log('[Animations] Undefined mixer.');
        }
    }

};

export { AnimationsModule };
