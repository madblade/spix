/**
 *
 */

'use strict';

class CollectionUtils
{
    // O(log(n))
    static _locationOf(element, array, start, end)
    {
        start = start || 0;
        end = end || array.length;
        let pivot = parseInt(start + (end - start) / 2, 10);
        if (end - start <= 1 || array[pivot] === element) return pivot;
        if (array[pivot] < element) {
            return CollectionUtils._locationOf(element, array, pivot, end);
        } else {
            return CollectionUtils._locationOf(element, array, start, pivot);
        }
    }

    static insert(element, array)
    {
        if (array === undefined) {
            let e = new Error('BLD @insert: undefined array.');
            console.log(e.stack);
            return -1;
        }
        let location = CollectionUtils._locationOf(element, array) + 1;
        if (array[location] === element) {
            console.log('Util.insert: element already in sorted array.');
            return location;
        }
        array.splice(location, 0, element);
        return location;
    }

    static insertWithLocation(location, element, array)
    {
        if (array === undefined) {
            let e = new Error('BLD: undefined array.');
            console.log(e.stack);
            return -1;
        }
        if (array[location] === element) {
            console.log('Util.insert: element already in sorted array.');
            return location;
        }
        array.splice(location, 0, element);
        return location;
    }

    static generateId(collection, propertyIdName)
    {
        let random = () => Math.floor(Math.random() * 1000000);
        let id = random();

        if (collection instanceof Map)
        {
            while (collection.has(id)) id = random();
        }

        else if (collection instanceof Array)
        { // Array
            // Unicity mandatory check

            if (!propertyIdName) throw Error('@generateId: generating id for ' +
                'array for unknown property identifier');

            let f = e => e[propertyIdName] === id;
            while (collection.filter(f).length > 0) id = random();
        }

        else if (collection instanceof Object)
        { // Object <-> Map
            // Unicity mandatory check
            while (id in collection) id = random();
        }

        return id;
    }

    static numberOfProperties(object)
    {
        return Object.keys(object).length;
    }

    static removeFromArray(array, object)
    {
        if (array === undefined)
        {
            let e = new Error('BLD @removeFromArray: undefined array.');
            console.log(e.stack);
            return -1;
        }
        const objectId = array.indexOf(object);
        if (objectId > -1) array.splice(objectId, 1);
        return objectId;
    }

    static removeFromArrayWithId(array, objectId)
    {
        if (objectId > -1) array.splice(objectId, 1);
    }

    static forEachProperty(object, func)
    {
        Object.keys(object).forEach(func);
    }
}

export default CollectionUtils;
