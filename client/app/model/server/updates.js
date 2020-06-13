/**
 *
 */

'use strict';

let UpdateModule = {

    updateMe(data)
    {
        if (!this.isRunning) return;
        data = JSON.parse(data);

        let mainState = data[0];
        this.selfModel.updateSelf(
            mainState[0], mainState[1], mainState[2],
            mainState[3]
        );
    },

    updateEntities(data)
    {
        if (!this.isRunning) return;
        data = JSON.parse(data);

        this.entityModel.updateEntities(data);
    },

    updateChunks(data)
    {
        if (!this.isRunning) return;
        data = JSON.parse(data);

        this.chunkModel.updateChunks(data);
    },

    updateX(data)
    {
        if (!this.isRunning) return;
        data = JSON.parse(data);

        this.xModel.updateX(data);
    }

};

export { UpdateModule };
