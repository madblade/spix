
'use strict';

import { Rasterizer }        from './pixel';
import { FieldModifier }     from './modifier';
import { Eroder }            from './erosion';
import { CityPlacer }        from './cities';
import { TerrainGenerator }  from './terrain';
import { LanguageGenerator } from '../../language/language';
import { NameGiver }         from '../names';
import { Mesher }            from '../mesh';

const STEPS = Object.freeze({
    WAITING: -1,
    START: 0,

    HEIGHTMAP_INIT: 1, // macro Gaussian
    HEIGHTMAP_MOUNTAINS: 2, // 50 Gaussian
    HEIGHTMAP_RELAX: 3, // relax + peaky
    HEIGHTMAP_EROSION: 4, // MULTIPLE PASSES
    HEIGHTMAP_LEVEL: 5, // set sea level + fill sinks
    HEIGHTMAP_CLEAN: 6, // clean coast

    OBJECTS_RIVERS: 7, //
    OBJECTS_CITIES: 8, //
    OBJECTS_BIOMES: 9, //

    RASTER_TRIMESH: 10, // compute trimesh + init buffer
    RASTER_RASTERIZE: 11, // MULTIPLE PASSES
    RASTER_NOISE_PASS: 12,
    RASTER_RIVER_PASS: 13,
    RASTER_TREE_PASS: 14,
    RASTER_CITY_PASS: 15,

    READY: 16
});

let Tile = function(
    coordX, coordY, dimension,
    country
)
{
    this.coordX = coordX;
    this.coordY = coordY;
    this.dimension = dimension;
    this.country = country; // contains pre-computed Voronoi in country.mesh
    this.buffer = new Float64Array(country.mesh.tris.length);

    const tileSeed = `a${coordX},${coordY}`;
    this.tileSeed = tileSeed;

    this.rasterizer = new Rasterizer(this.dimension);
    this.mesher = new Mesher();
    this.fieldModifier = new FieldModifier(this.mesher, tileSeed);
    this.eroder = new Eroder(this.mesher);
    this.cityPlacer = new CityPlacer(this.mesher, this.fieldModifier, this.eroder);
    this.terrainGenerator = new TerrainGenerator(this.mesher, this.fieldModifier, this.eroder, tileSeed);

    // this.biomePlacer = new BiomePlacer(tileSeed);
    this.languageGenerator = new LanguageGenerator(tileSeed);
    this.nameGiver = new NameGiver(this.languageGenerator);

    // Progressive
    this.needsGeneration = false;
    this.step = STEPS.WAITING;
    this.ready = false;
    this.presentInScene = false; // when added
};

Tile.prototype.setNoiseTile = function(noiseTile)
{
    this.rasterizer.setNoiseTile(noiseTile);
};

Tile.prototype.stepGeneration = function()
{
    if (this.ready) return;
    let mesh = this.country.mesh;
    let fieldModifier = this.fieldModifier;
    let terrainGenerator = this.terrainGenerator;
    let eroder = this.eroder;
    let country = this.country;
    let cityPlacer = this.cityPlacer;
    let rasterizer = this.rasterizer;

    switch (this.step)
    {
        case STEPS.WAITING:
            this.step++;
            break;
        case STEPS.START:
            const bl = mesh.tris.length;
            this.fieldModifier.resetBuffer(bl);
            this.fieldModifier.swapBuffers(this);
            this.fieldModifier.resetBuffer(bl);
            this.step++;
            break;
        case STEPS.HEIGHTMAP_INIT:
            // fieldModifier.addSlope(mesh, terrainGenerator.randomVector(4));
            fieldModifier.addCone(mesh, this.buffer, -1);
            fieldModifier.addSlope(mesh, this.buffer, this.coordX, this.coordY);
            this.step++;
            break;
        case STEPS.HEIGHTMAP_MOUNTAINS: // 50 passes to optimize
            fieldModifier.addMountains(mesh, this.buffer, 5);
            if (fieldModifier.nbMountains >= 50)
                this.step++;
            break;
        case STEPS.HEIGHTMAP_RELAX: // relax + peaky + set erosion amount for next pass
            for (let i = 0; i < 10; i++)
                fieldModifier.relax(mesh, this);
            fieldModifier.peaky(mesh, this.buffer);
            let el = terrainGenerator.runif(0.04, 0.1);
            eroder.setErosionAmount(el);
            this.step++;
            break;
        case STEPS.HEIGHTMAP_EROSION: // fill sinks multiple passes
            eroder.stepErosion(mesh, this, 5);
            // eroder.doErosion(mesh, eroder.amount, 5);
            if (eroder.ready)
                this.step++;
            break;
        case STEPS.HEIGHTMAP_LEVEL:
            let sl = terrainGenerator.runif(0.2, 0.6);
            fieldModifier.setSeaLevel(mesh, this.buffer, sl);
            this.step++;
            break;
        case STEPS.HEIGHTMAP_CLEAN:
            // eroder.fillSinks(mesh);
            eroder.cleanCoast(mesh, this);
            if (eroder.cleanCoastPass >= 3) // 3 iterations
                this.step++;
            break;

        case STEPS.OBJECTS_RIVERS:
            country.rivers = cityPlacer.getRivers(country.mesh, this, 0.01);
            this.step++;
            break;
        case STEPS.OBJECTS_CITIES:
            cityPlacer.placeCities(country, this, 3);
            if (cityPlacer.nbCities >= country.params.ncities)
                this.step++;
            break;
        case STEPS.OBJECTS_BIOMES:
            // let biomePlacer = this.biomePlacer;
            // biomePlacer.initBuffer(country.mesh.vxs.length);
            // biomePlacer.computeBiomes(country.mesh);
            rasterizer.seedChunkRandom(this.tileSeed);
            rasterizer.computeChunkTreeDensity();
            this.step++;
            break;
            // country.coasts = mesher.contour(country.mesh, 0);
            // country.terr = cityPlacer.getTerritories(country);
            // country.borders = cityPlacer.getBorders(country);

        case STEPS.RASTER_TRIMESH:
            let triMesh = rasterizer.computeTriMesh(country.mesh, this);
            this.triMesh = triMesh;
            rasterizer.initBuffers();
            this.step++;
            break;
        case STEPS.RASTER_RASTERIZE:
            rasterizer.heightPass(this.triMesh);
            if (rasterizer.heightPassDone)
                this.step++;
            break;
        case STEPS.RASTER_NOISE_PASS:
            // rasterizer.noisePass(5.0);
            this.step++;
            break;
        case STEPS.RASTER_RIVER_PASS:
            rasterizer.riverPass(country.rivers);
            this.step++;
            break;
        case STEPS.RASTER_TREE_PASS:
            rasterizer.treePass();
            this.step++;
            break;
        case STEPS.RASTER_CITY_PASS:
            rasterizer.cityPass(country.mesh, country.cities);
            this.step++;
            break;

        case STEPS.READY:
            // console.log(this.getRaster());
            this.ready = true;
            break;
    }
};

Tile.prototype.processHeightMap = function()
{
    let fieldModifier = this.fieldModifier;
    let mesh = this.country.mesh;
    let eroder = this.eroder;
    let terrainGenerator = this.terrainGenerator;

    fieldModifier.resetBuffer(mesh.tris.length);
    fieldModifier.addSlope(mesh, terrainGenerator.randomVector(4));
    fieldModifier.addCone(mesh, terrainGenerator.runif(-1, -1));
    fieldModifier.addMountains(mesh, 50);
    for (let i = 0; i < 10; i++)
    {
        fieldModifier.relax(mesh);
    }

    fieldModifier.peaky(mesh);

    let el = terrainGenerator.runif(0, 0.1);
    eroder.doErosion(mesh, el, 5);

    let sl = terrainGenerator.runif(0.2, 0.6);
    fieldModifier.setSeaLevel(mesh, sl);

    eroder.fillSinks(mesh);
    eroder.cleanCoast(mesh, 3);
};

Tile.prototype.placeObjects = function()
{
    let country = this.country;
    let cityPlacer = this.cityPlacer;
    let mesher = this.mesher;

    cityPlacer.placeCities(country);
    country.rivers = cityPlacer.getRivers(country.mesh, 0.01);
    country.coasts = mesher.contour(country.mesh, 0);
    country.terr = cityPlacer.getTerritories(country);
    country.borders = cityPlacer.getBorders(country);
};

Tile.prototype.renderToRaster = function()
{
    let rasterizer = this.rasterizer;
    let country = this.country;

    let triMesh = rasterizer.computeTriMesh(country.mesh);
    this.triMesh = triMesh;
    rasterizer.initBuffers(triMesh);
    rasterizer.heightPass(triMesh);
    rasterizer.noisePass(5.0);
    // console.log(rasterizer.heightBuffer);
    rasterizer.riverPass(country.rivers);
    rasterizer.cityPass(country.mesh, country.cities);
};

Tile.prototype.getRaster = function()
{
    return this.rasterizer.heightBuffer;
};

Tile.prototype.getSurfaceRaster = function()
{
    return this.rasterizer.surfaceBuffer;
};

Tile.prototype.getCountry = function()
{
    return this.country;
};

export { Tile };
