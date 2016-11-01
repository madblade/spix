/**
 *
 */

'use strict';

App.Engine.UI.prototype.getAZERTY = function (layout) {
    return {
        // Arrow directional controls.
        arrowUp: 38,
        arrowDown: 40,
        arrowRight: 39,
        arrowLeft: 37,

        // Left hand directional controls.
        leftHandUp: 90,     // Z
        leftHandLeft: 81,   // Q
        leftHandDown: 83,   // S
        leftHandRight: 68,  // D

        // Left hand advanced controls.
        leftHandNorthWest: 65,     // A
        leftHandNorthEast: 69,     // E
        leftHandNorthEast2: 82,    // R
        leftHandEast2: 70,         // F
        leftHandSouthWest: 87,     // W
        leftHandSouth: 88,         // X
        leftHandSouthEast: 67,      // C

        // Modifiers.
        alt: 18,
        shift: 16,
        control: 17,
        tab: 9,

        // Misc.
        escape: 27,
        space: 32,
        backspace: 8,
        enter: 13,
        pageUp: 33,
        pageDown: 34,

        // Number line.
        one: 49,
        two: 50,
        three: 51,
        four: 52,
        five: 53,
        six: 54,
        seven: 55,
        eight: 56,
        nine: 57,

        // Number pad.
        // 1. if verr.num is activated.
        padOne: 97,
        padTwo: 98,
        padThree: 99,
        padFour: 100,
        padFive: 101,
        padSix: 102,
        padSeven: 103,
        padEight: 104,
        padNine: 105,
        // 2. if verr.num is not activatedpadOne: 97,
        padOneAlt: 35,
        padTwoAlt: 40,
        padThreeAlt: 34,
        padFourAlt: 37,
        padFiveAlt: 12,
        padSixAlt: 39,
        padSevenAlt: 36,
        padEightAlt: 38,
        padNineAlt: 33,

        // TODO all other letters
        f: 70
    };
};
