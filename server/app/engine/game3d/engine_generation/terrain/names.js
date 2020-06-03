
'use strict';

let NameGiver = function(languageGenerator)
{
    if (!languageGenerator) throw Error('Invalid argument.');

    this.buffer = [];

    this.languageGenerator = languageGenerator;
};

NameGiver.prototype.giveNames = function(country)
{
    const rlg = this.languageGenerator;
    let lang = rlg.makeRandomLanguage();

    let cities = country.cities;
    let terr = country.terr;
    let nterrs = country.params.nterrs;

    if (cities) {
        let cityNames = [];
        for (let i = 0; i < cities.length; i++) {
            cityNames.push(rlg.makeName(lang, 'city'));
        }
        country.cityNames = cityNames;
    }

    if (terr) {
        let regionNames = [];
        for (let i = 0; i < nterrs; i++) {
            regionNames.push(rlg.makeName(lang, 'region'));
        }
        country.regionNames = regionNames;
    }
};

export {
    NameGiver
};
