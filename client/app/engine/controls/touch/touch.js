/**
 *
 */

'use strict';

import extend from '../../../extend.js';

import { ListenerModule } from './listeners.js';

let TouchModule = {

    setupTouch() {
        // var startX,
        //     startY,
        //     dX, dY, daX, daY,
        //     threshold = 150, // Required min distance traveled to be considered swipe.
        //     allowedTime = 250, // Maximum time allowed to travel that distance.
        //     elapsedTime,
        //     startTime;

        // this.startTouchListeners();
    },

    startTouchListeners() {
        this.registerTouch();
    },

    stopTouchListeners() {
        this.unregisterTouch();
    }

};

extend(TouchModule, ListenerModule);

export { TouchModule };
