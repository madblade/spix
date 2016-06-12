/**
 *
 */

'use strict';

import Physics from '../physics';
import UserInput from '../ui/input';
import UserOutput from '../ui/output';
import AI from '../ai';
import EntityManager from '../objects/entities/manager';
import WorldManager from '../objects/world/manager';

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

    static createEntityManager(worldManager) {
        return new EntityManager(worldManager);
    }

    static createWorldManager() {
        return new WorldManager();
    }

}

export default Flat3Factory;
