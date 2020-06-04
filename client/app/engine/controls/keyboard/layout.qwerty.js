/**
 *
 */

'use strict';

let LayoutQWERTY = {

    getQWERTY()
    {
        return Object.freeze({
            // Arrow directional controls.
            arrowUp: 38,
            arrowDown: 40,
            arrowRight: 39,
            arrowLeft: 37,

            // Left hand directional controls.
            leftHandUp: 87,     // W
            leftHandLeft: 65,   // A
            leftHandDown: 83,   // S
            leftHandRight: 68,  // D

            // Left hand advanced controls.
            leftHandNorthWest: 81,     // Q
            leftHandNorthEast: 69,     // E
            leftHandNorthEast2: 82,    // R
            leftHandEast2: 70,         // F
            leftHandSouthWest: 90,     // Z
            leftHandSouth: 88,         // X
            leftHandSouthEast: 67,     // C

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
            // 2. if verr.num is not activated
            padOneAlt: 35,
            padTwoAlt: 40,
            padThreeAlt: 34,
            padFourAlt: 37,
            padFiveAlt: 12,
            padSixAlt: 39,
            padSevenAlt: 36,
            padEightAlt: 38,
            padNineAlt: 33,

            // All other letters
            leftHandNorthEast3: 84,     // T
            leftHandEast3: 71,          // G
            leftHandSouthEast3: 86,     // V

            rightHandUp: 73,            // I
            rightHandDown: 75,          // K
            rightHandLeft: 74,          // J
            rightHandLeft2: 72,         // H
            rightHandRight: 76,         // L
            rightHandRight2: 186,       // ;
            rightHandSouth: 188,        // ,

            rightHandNorthWest: 85,     // U
            rightHandNorthWest2: 89,    // Y
            rightHandNorthEast: 79,     // O
            rightHandNorthEast2: 80,    // P
            rightHandSouthWest: 77,     // M
            rightHandSouthWest2: 78,    // N
            rightHandSouthWest3: 66,    // B
            rightHandSouthEast: 190,    // .
            rightHandSouthEast2: 191    // /

        });
    }

};

export { LayoutQWERTY };
