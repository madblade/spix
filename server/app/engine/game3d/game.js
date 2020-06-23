/**
 *
 */

'use strict';

import Game              from '../../model/game/game';

import UserInput         from './io_user/input/input';
import UserOutput        from './io_user/output/output';
import AIInput           from './io_ai/input/input';
import AIOutput          from './io_ai/output/output';
import AI                from './io_ai/ai';

import PhysicsEngine     from './engine_physics/physics';
import TopologyEngine    from './engine_topology/topology';
import ConsistencyEngine from './engine_consistency/consistency';

import EntityModel      from './model_entity/model';
import WorldModel       from './model_world/model';
import XModel           from './model_x/model';
import ConsistencyModel from './model_consistency/model';

import Chat             from './../../model/connection/chat';
// import TimeUtils from '../math/time';
import GenerationEngine from './engine_generation/generation';

const GameType = Object.freeze({
    FLAT: Symbol('flat'),
    CUBE: Symbol('cube'),
    DEMO: Symbol('demo'),
    UNSTRUCTURED: Symbol('unstructured'),
    FANTASY: Symbol('fantasy')
});

class Game3D extends Game
{
    static serverRefreshRate = 16;
    static waitFramesToOutputEntities = 3; // Increase to reduce the netload!
    // Client must have entity / self interpolation activated.

    constructor(hub, gameId, connector, gameInfo, isServerLocal)
    {
        super(hub, gameId, connector, isServerLocal);

        // Utility parameters
        this._kind = gameInfo.kind;
        this._gameInfo = gameInfo;
        this._refreshRate = Game3D.serverRefreshRate;
        //this._refreshRate = 1000;
        this._tt = 0;
        this._frameMod1000 = 0;

        // Misc.
        this._chat = new Chat(this);

        // Models (autonomous).
        this._worldModel        = new WorldModel(this);
        this._entityModel       = new EntityModel(this);
        this._xModel            = new XModel(this, this._worldModel);
        this._consistencyModel  = new ConsistencyModel(this);

        // Engines (need models).
        this._ai                = new AI(this);
        this._physicsEngine     = new PhysicsEngine(this);
        this._topologyEngine    = new TopologyEngine(this);
        this._consistencyEngine = new ConsistencyEngine(this);
        this._generationEngine  = new GenerationEngine(this);

        // I/O (need engines).
        this._internalInput     = new AIInput(this);    // A.I.
        this._internalOutput    = new AIOutput(this);   // A.I.
        this._externalInput     = new UserInput(this);  // Human.
        this._externalOutput    = new UserOutput(this); // Human.

        // Generate then listen players.
        this.generate();
    }

    // Model

    get gameInfo()          { return this._gameInfo; }

    get entityModel()       { return this._entityModel; }
    get worldModel()        { return this._worldModel; }
    get xModel()            { return this._xModel; }
    get consistencyModel()  { return this._consistencyModel; }

    get ai()                { return this._ai; }
    get physicsEngine()     { return this._physicsEngine; }
    get topologyEngine()    { return this._topologyEngine; }
    get consistencyEngine() { return this._consistencyEngine; }

    get chat()              { return this._chat; }
    get refreshRate()       { return this._refreshRate; }

    static bench = false;

    //^
    update()
    {
        if (!this._isRunning)
        {
            // This happens when on FF when the user has created a local
            // sandbox game  in which no one else is present.
            // console.log('[Game3D] Called update on non-running game.');
            return;
        }

        this._frameMod1000 = (this._frameMod1000 + 1) % 1000;
        // Idea maybe split in several loops (purposes).
        // let debugThresh = 4000; // microsecs

        /** Inputs **/
        // Update intents.
        this._ai.update();

        // Update human spawn/leave requests.
        this._externalInput.update();
        // Update artificial inputs.
        this._internalInput.update();

        /** Updates **/
        // Update topological (terrain) model.
        this._topologyEngine.update();
        // Update physical simulation.
        this._physicsEngine.update();

        /** Chunk and WorldMap Generation **/
        // Update fantasy map generation.
        this._generationEngine.update();

        /** Consistency solving: mediator between player and server models **/
        // Make client models consistent. Needs other engines.
        const updateEntities = this._frameMod1000 % Game3D.waitFramesToOutputEntities === 0;
        this._consistencyEngine.update(updateEntities);

        /** Outputs **/
        // Send updates.
        this._externalOutput.update(updateEntities);
        // Update perceptions.
        this._internalOutput.update();

        // var n = this._playerManager.nbPlayers;
        // console.log("There " + (n>1?"are ":"is ") + n + " player" + (n>1?"s":"") + " connected.");
        // this._tt += 1;
        // if (this._tt % 1000 === 0) console.log((TimeUtils.getTimeSecNano(time)[1]/1000) + " µs a loop.");
        // const t1 = TimeUtils.getTimeSecNano(t0)[1] / 1000;
        // if (t1 > 4000 && Game3D.bench) console.log(`${t1} µs.`);

        // Pause game with idle timeout when no-one is connected.
        if (this._playerManager.nbPlayers < 1)
            this.pause(false);
    }

    generate()
    {
        // The following takes a while to generate Voronoi
        if (this.gameInfo.kind === GameType.FANTASY)
            this._generationEngine.initializeWorldMap(-1);

        // Create empty chunks (these will be generated when the WorldMap is ready)
        this._consistencyEngine.generateWorld()
            .then(() => {
                this._playerManager.setAddPlayerBehaviour(p => {
                    this._externalInput.addPlayer(p);
                });

                this._playerManager.setRemovePlayerBehaviour(player => {
                    this._externalInput.removePlayer(player.avatar.entityId);
                });

                this._ready = true;
            })
            .catch(e => console.log(e));
    }

    save()
    {
        // XXX [SAVE] write world and entities into file.
    }
}

export { Game3D as default, GameType };
