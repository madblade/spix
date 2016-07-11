/**
 *
 */

'use strict';

class CollectionUtils {

    // O(log(n))
    static _locationOf(element, array, start, end) {
        start = start || 0;
        end = end || array.length;
        var pivot = parseInt(start + (end - start) / 2, 10);
        if (end-start <= 1 || array[pivot] === element) return pivot;
        if (array[pivot] < element) {
            return CollectionUtils._locationOf(element, array, pivot, end);
        } else {
            return CollectionUtils._locationOf(element, array, start, pivot);
        }
    }

    static insert(element, array) {
        if (array === undefined) {
            console.log("BLD: undefined array.");
            return -1;
        }
        var location = CollectionUtils._locationOf(element, array) + 1;
        if (array[location] === element) {
        console.log("Util.insert: element already in sorted array.");
            return location;
        }
        array.splice(location, 0, element);
        return location;
    }

    static generateId(collection) {
        var random = () => Math.floor(Math.random() * 1000000);
        var id = random();

        if (collection instanceof Array) { // Array
            // Unicity mandatory check
            var f = ((e) => e.id === id);
            while (collection.filter(f).length > 0) id = random();
        }

        else if (collection instanceof Object) { // Object <-> Map
            // Unicity mandatory check
            while (id in collection) id = random();
        }

        return id;
    }

    static numberOfProperties(object) {
        return Object.keys(object).length;
    }

    static numberOfNestedProperties(object) {
        var result = 0;
        for (var property in object)
            if (object.hasOwnProperty(property))
                result+=Object.keys(object[property]).length;
        return result;
    }

    static removeFromArray(array, object) {
        if (array === undefined) {
            console.log("BLD: undefined array.");
            return -1;
        }
        var objectId = array.indexOf(object);
        if (objectId > -1) array.splice(objectId, 1);
        return objectId;
    }

    static removeFromArrayWithId(array, objectId) {
        if (objectId > -1) array.splice(objectId, 1);
    }

    static forEachProperty(object, func) {
        Object.keys(object).forEach(func);
    }

}

export default CollectionUtils;
