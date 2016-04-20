/**
 *
 */

'use strict';

import Physics from '../physics';
import UserInput from '../ui';
import AI from '../ai';
import ObjectManager from '../objects';

class Flat3Factory {

    static createPhysics() {
        return new Physics();
    }

    static createUserInput() {
        return new UserInput();
    }

    static createAI() {
        return new AI();
    }

    static createObjectManager() {
        return new ObjectManager();
    }

}

export default Flat3Factory;
