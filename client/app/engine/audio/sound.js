/**
 *
 */

'use strict';

var Sound = function(name, buffer)
{
    this.name = name;
    this.buffer = buffer;
    this.playing = false;

    this.play = function()
    {
        this.stopAllSounds();
        this.source = this.audioContext.createBufferSource();
        this.source.buffer = buffer;
        this.source.connect(this.audioContext.destination);
        this.playing = true;
        this.source.start();
    }.bind(this);
};

export { Sound };
