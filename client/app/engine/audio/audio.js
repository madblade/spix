/**
 * Audio.
 */

'use strict';

import extend from '../../extend.js';
import { Sound } from './sound.js';

let Audio = function(app)
{
    this.app = app;

    // User customizable settings.
    this.settings = {};

    this.audioContext = null;
    this.source = null;
    this.sounds = {all: [
        //'sound01',
        //'sound02'
    ]};
};

extend(Audio.prototype, {

    run()
    {
        let audioContext;
        function loadSound(name, callback)
        {
            let xObj = new XMLHttpRequest();
            xObj.open('GET', `audio/${name}.mp3`, true);
            xObj.responseType = 'arraybuffer';
            xObj.onreadystatechange = function() {
                if (parseInt(xObj.readyState, 10) === 4 && parseInt(xObj.status, 10) === 200) {
                    audioContext.decodeAudioData(xObj.response, function(buffer) {
                        callback(buffer);
                    });
                }
            };
            xObj.send(null);
        }

        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();

            let sounds = this.sounds;
            sounds.all.forEach(function(sound) {
                loadSound(sound, function(buffer) {
                    sounds[sound] = new Sound(sound, buffer);
                });
            });
        } catch (e) {
            /*
             $("#content").fadeOut(function() {
             $(this).html($("#contentNoAudio").html(),'fast').fadeIn('fast');
             });
             */
        }
    },

    stop()
    {
        this.stopAllSounds();
    },

    stopAllSounds()
    {
        let sounds = this.sounds;
        sounds.all.forEach(function(sound) {
            if (sounds[sound].source !== null && sounds[sound].playing) {
                sounds[sound].source.stop();
                sounds[sound].playing = false;
            }
        });
    }

});

export { Audio };
