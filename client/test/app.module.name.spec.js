/* eslint-disable */

import { Sound }              from '../app/engine/audio/sound';

describe('This [client] test', function() {
    it('should pass', function() {
        expect(true).toBe(true);
    });
});

describe('This other [client] test', function() {
    it('should pass', function() {
        expect(true).toBe(true);
    });
});

describe('sound object', function() {
    it('should be properly named', function() {
        let s = new Sound('a', '');
        expect(s.name).toEqual('a');
    });
});
