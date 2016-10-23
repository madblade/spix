/**
 * Audio.
 */

'use strict';

App.Engine.Audio = function(app) {
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

App.Engine.Audio.prototype.run = function() {

    function loadSound(name, callback) {
        var xObj = new XMLHttpRequest();
        xObj.open('GET', 'audio/' + name + '.mp3', true);
        xObj.responseType = 'arraybuffer';
        xObj.onreadystatechange = function () {
            if (xObj.readyState == 4 && xObj.status == "200") {
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

        var sounds = this.sounds;
        sounds.all.forEach(function(sound) {
            loadSound(sound, function (buffer) {
                sounds[sound] = new App.Engine.Audio.Sound(sound, buffer);
            });
        });
    } catch(e) {
        /*
        $("#content").fadeOut(function() {
            $(this).html($("#contentNoAudio").html(),'fast').fadeIn('fast');
        });
        */
    }
};

App.Engine.Audio.prototype.stopAllSounds = function() {
    var sounds = this.sounds;
    sounds.all.forEach(function(sound) {
        if (sounds[sound].source !== null && sounds[sound].playing) {
            sounds[sound].source.stop();
            sounds[sound].playing = false;
        }
    });
};

App.Engine.Audio.Sound = function(name, buffer) {
    this.name = name;
    this.buffer = buffer;
    this.playing = false;

    this.play = function() {
        this.stopAllSounds();
        this.source = this.audioContext.createBufferSource();
        this.source.buffer = buffer;
        this.source.connect(this.audioContext.destination);
        this.playing = true;
        this.source.start();
    }.bind(this);
};
