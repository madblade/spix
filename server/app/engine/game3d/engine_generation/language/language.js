
'use strict';

import { Random } from '../terrain/tile/random';

let LanguageGenerator = function(seed)
{
    seed = seed || 'language';
    this.randomGenerator = new Random(seed);
};

LanguageGenerator.prototype.shuffled = function(list)
{
    let newlist = [];
    for (let i = 0; i < list.length; i++) {
        newlist.push(list[i]);
    }
    for (let i = list.length - 1; i > 0; i--) {
        let tmp = newlist[i];
        let j = this.randrange(i);
        newlist[i] = newlist[j];
        newlist[j] = tmp;
    }
    return newlist;
};

LanguageGenerator.prototype.choose = function(list, exponent)
{
    let rng = this.randomGenerator;
    exponent = exponent || 1;
    let r = rng.uniform();
    return list[Math.floor(Math.pow(r, exponent) * list.length)];
};

LanguageGenerator.prototype.randrange = function(lo, hi)
{
    let rng = this.randomGenerator;
    if (hi === undefined) {
        hi = lo;
        lo = 0;
    }
    let r = rng.uniform();
    return Math.floor(r * (hi - lo)) + lo;
};

LanguageGenerator.prototype.join = function(list, sep)
{
    if (list.length === 0) return '';
    sep = sep || '';
    let s = list[0];
    for (let i = 1; i < list.length; i++) {
        s += sep;
        s += list[i];
    }
    return s;
};

LanguageGenerator.prototype.capitalize = function(word)
{
    return word[0].toUpperCase() + word.slice(1);
};

LanguageGenerator.prototype.spell = function(lang, syll)
{
    if (lang.noortho) return syll;
    let s = '';
    for (let i = 0; i < syll.length; i++) {
        let c = syll[i];
        s += lang.cortho[c] || lang.vortho[c] || defaultOrtho[c] || c;
    }
    return s;
};

LanguageGenerator.prototype.makeSyllable = function(lang)
{
    let rng = this.randomGenerator;

    while (true)
    {
        let syll = '';
        for (let i = 0; i < lang.structure.length; i++) {
            let ptype = lang.structure[i];
            if (lang.structure[i + 1] === '?') {
                i++;
                let r = rng.uniform();
                if (r < 0.5) {
                    continue;
                }
            }
            syll += this.choose(lang.phonemes[ptype], lang.exponent);
        }
        let bad = false;
        for (let i = 0; i < lang.restricts.length; i++) {
            if (lang.restricts[i].test(syll)) {
                bad = true;
                break;
            }
        }
        if (bad) continue;
        return this.spell(lang, syll);
    }
};

LanguageGenerator.prototype.getMorpheme = function(lang, key)
{
    if (lang.nomorph) {
        return this.makeSyllable(lang);
    }
    key = key || '';
    let list = lang.morphemes[key] || [];
    let extras = 10;
    if (key) extras = 1;
    while (true) {
        let n = this.randrange(list.length + extras);
        if (list[n]) return list[n];
        let morph = this.makeSyllable(lang);
        let bad = false;
        for (let k in lang.morphemes) {
            if (lang.morphemes[k].includes(morph)) {
                bad = true;
                break;
            }
        }
        if (bad) continue;
        list.push(morph);
        lang.morphemes[key] = list;
        return morph;
    }
};

LanguageGenerator.prototype.makeWord = function(lang, key)
{
    let nsylls = this.randrange(lang.minsyll, lang.maxsyll + 1);
    let w = '';
    let keys = [];
    keys[this.randrange(nsylls)] = key;
    for (let i = 0; i < nsylls; i++) {
        w += this.getMorpheme(lang, keys[i]);
    }
    return w;
};

LanguageGenerator.prototype.getWord = function(lang, key)
{
    key = key || '';
    let ws = lang.words[key] || [];
    let extras = 3;
    if (key) extras = 2;
    while (true) {
        let n = this.randrange(ws.length + extras);
        let w = ws[n];
        if (w) {
            return w;
        }
        w = this.makeWord(lang, key);
        let bad = false;
        for (let k in lang.words) {
            if (lang.words[k].includes(w)) {
                bad = true;
                break;
            }
        }
        if (bad) continue;
        ws.push(w);
        lang.words[key] = ws;
        return w;
    }
};

LanguageGenerator.prototype.makeName = function(lang, key)
{
    let rng = this.randomGenerator;

    key = key || '';
    lang.genitive = lang.genitive || this.getMorpheme(lang, 'of');
    lang.definite = lang.definite || this.getMorpheme(lang, 'the');
    while (true) {
        let name = null;
        if (rng.uniform() < 0.5) {
            name = this.capitalize(this.getWord(lang, key));
        } else {
            let w1 = this.capitalize(this.getWord(
                lang, rng.uniform() < 0.6 ? key : '')
            );
            let w2 = this.capitalize(this.getWord(
                lang, rng.uniform() < 0.6 ? key : '')
            );
            if (w1 === w2) continue;
            if (rng.uniform() > 0.5) {
                name = this.join([w1, w2], lang.joiner);
            } else {
                name = this.join([w1, lang.genitive, w2], lang.joiner);
            }
        }
        if (rng.uniform() < 0.1) {
            name = this.join([lang.definite, name], lang.joiner);
        }

        if (name.length < lang.minchar || name.length > lang.maxchar) continue;
        let used = false;
        for (let i = 0; i < lang.names.length; i++) {
            let name2 = lang.names[i];
            if (name.indexOf(name2) !== -1 || name2.indexOf(name) !== -1) {
                used = true;
                break;
            }
        }
        if (used) continue;
        lang.names.push(name);
        return name;
    }
};

LanguageGenerator.prototype.makeBasicLanguage = function()
{
    return {
        phonemes: {
            C: 'ptkmnls',
            V: 'aeiou',
            S: 's',
            F: 'mn',
            L: 'rl'
        },
        structure: 'CVC',
        exponent: 2,
        restricts: [],
        cortho: {},
        vortho: {},
        noortho: true,
        nomorph: true,
        nowordpool: true,
        minsyll: 1,
        maxsyll: 1,
        morphemes: {},
        words: {},
        names: [],
        joiner: ' ',
        maxchar: 12,
        minchar: 5
    };
};

LanguageGenerator.prototype.makeOrthoLanguage = function()
{
    let lang = this.makeBasicLanguage();
    lang.noortho = false;
    return lang;
};

LanguageGenerator.prototype.makeRandomLanguage = function()
{
    let lang = this.makeBasicLanguage();
    lang.noortho = false;
    lang.nomorph = false;
    lang.nowordpool = false;
    lang.phonemes.C = this.shuffled(this.choose(consets, 2).C);
    lang.phonemes.V = this.shuffled(this.choose(vowsets, 2).V);
    lang.phonemes.L = this.shuffled(this.choose(lsets, 2).L);
    lang.phonemes.S = this.shuffled(this.choose(ssets, 2).S);
    lang.phonemes.F = this.shuffled(this.choose(fsets, 2).F);
    lang.structure = this.choose(syllstructs);
    lang.restricts = ressets[2].res;
    lang.cortho = this.choose(corthsets, 2).orth;
    lang.vortho = this.choose(vorthsets, 2).orth;
    lang.minsyll = this.randrange(1, 3);
    if (lang.structure.length < 3) lang.minsyll++;
    lang.maxsyll = this.randrange(lang.minsyll + 1, 7);
    lang.joiner = this.choose('   -');
    return lang;
};

const defaultOrtho = {
    ʃ: 'sh',
    ʒ: 'zh',
    ʧ: 'ch',
    ʤ: 'j',
    ŋ: 'ng',
    j: 'y',
    x: 'kh',
    ɣ: 'gh',
    ʔ: '‘',
    A: 'á',
    E: 'é',
    I: 'í',
    O: 'ó',
    U: 'ú'
};

const corthsets = [
    {
        name: 'Default',
        orth: {}
    },
    {
        name: 'Slavic',
        orth: {
            ʃ: 'š',
            ʒ: 'ž',
            ʧ: 'č',
            ʤ: 'ǧ',
            j: 'j'
        }
    },
    {
        name: 'German',
        orth: {
            ʃ: 'sch',
            ʒ: 'zh',
            ʧ: 'tsch',
            ʤ: 'dz',
            j: 'j',
            x: 'ch'
        }
    },
    {
        name: 'French',
        orth: {
            ʃ: 'ch',
            ʒ: 'j',
            ʧ: 'tch',
            ʤ: 'dj',
            x: 'kh'
        }
    },
    {
        name: 'Chinese (pinyin)',
        orth: {
            ʃ: 'x',
            ʧ: 'q',
            ʤ: 'j',
        }
    }
];

const vorthsets = [
    {
        name: 'Ácutes',
        orth: {}
    },
    {
        name: 'Ümlauts',
        orth: {
            A: 'ä',
            E: 'ë',
            I: 'ï',
            O: 'ö',
            U: 'ü'
        }
    },
    {
        name: 'Welsh',
        orth: {
            A: 'â',
            E: 'ê',
            I: 'y',
            O: 'ô',
            U: 'w'
        }
    },
    {
        name: 'Diphthongs',
        orth: {
            A: 'au',
            E: 'ei',
            I: 'ie',
            O: 'ou',
            U: 'oo'
        }
    },
    {
        name: 'Doubles',
        orth: {
            A: 'aa',
            E: 'ee',
            I: 'ii',
            O: 'oo',
            U: 'uu'
        }
    }
];

const consets = [
    {
        name: 'Minimal',
        C: 'ptkmnls'
    },
    {
        name: 'English-ish',
        C: 'ptkbdgmnlrsʃzʒʧ'
    },
    {
        name: 'Pirahã (very simple)',
        C: 'ptkmnh'
    },
    {
        name: 'Hawaiian-ish',
        C: 'hklmnpwʔ'
    },
    {
        name: 'Greenlandic-ish',
        C: 'ptkqvsgrmnŋlj'
    },
    {
        name: 'Arabic-ish',
        C: 'tksʃdbqɣxmnlrwj'
    },
    {
        name: 'Arabic-lite',
        C: 'tkdgmnsʃ'
    },
    {
        name: 'English-lite',
        C: 'ptkbdgmnszʒʧhjw'
    }
];

const ssets = [
    {
        name: 'Just s',
        S: 's'
    },
    {
        name: 's ʃ',
        S: 'sʃ'
    },
    {
        name: 's ʃ f',
        S: 'sʃf'
    }
];

const lsets = [
    {
        name: 'r l',
        L: 'rl'
    },
    {
        name: 'Just r',
        L: 'r'
    },
    {
        name: 'Just l',
        L: 'l'
    },
    {
        name: 'w j',
        L: 'wj'
    },
    {
        name: 'r l w j',
        L: 'rlwj'
    }
];

const fsets = [
    {
        name: 'm n',
        F: 'mn'
    },
    {
        name: 's k',
        F: 'sk'
    },
    {
        name: 'm n ŋ',
        F: 'mnŋ'
    },
    {
        name: 's ʃ z ʒ',
        F: 'sʃzʒ'
    }
];

const vowsets = [
    {
        name: 'Standard 5-vowel',
        V: 'aeiou'
    },
    {
        name: '3-vowel a i u',
        V: 'aiu'
    },
    {
        name: 'Extra A E I',
        V: 'aeiouAEI'
    },
    {
        name: 'Extra U',
        V: 'aeiouU'
    },
    {
        name: '5-vowel a i u A I',
        V: 'aiuAI'
    },
    {
        name: '3-vowel e o u',
        V: 'eou'
    },
    {
        name: 'Extra A O U',
        V: 'aeiouAOU'
    }
];

const syllstructs = [
    'CVC',
    'CVV?C',
    'CVVC?', 'CVC?', 'CV', 'VC', 'CVF', 'C?VC', 'CVF?',
    'CL?VC', 'CL?VF', 'S?CVC', 'S?CVF', 'S?CVC?',
    'C?VF', 'C?VC?', 'C?VF?', 'C?L?VC', 'VC',
    'CVL?C?', 'C?VL?C', 'C?VLC?'];

const ressets = [
    {
        name: 'None',
        res: []
    },
    {
        name: 'Double sounds',
        res: [/(.)\1/]
    },
    {
        name: 'Doubles and hard clusters',
        res: [/[sʃf][sʃ]/, /(.)\1/, /[rl][rl]/]
    }
];

export {
    LanguageGenerator
};
