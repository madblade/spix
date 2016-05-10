/**
 *
 */

'use strict';

import Physics from '../physics';
import UserInput from '../ui/input';
import UserOutput from '../ui/output';
import AI from '../ai';
import ObjectManager from '../objects/manager';

class Flat3Factory {

    static createPhysics() {
        return new Physics();
    }

    static createUserInput(game) {
        return new UserInput(game);
    }

    static createUserOutput(game) {
        return new UserOutput(game);
    }

    static createAI() {
        return new AI();
    }

    static createObjectManager() {
        return new ObjectManager();
    }

}

export default Flat3Factory;
