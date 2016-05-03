/**
 *
 */

'use strict';

class CollectionUtils {

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
        var objectId = array.indexOf(object);
        if (objectId > -1) array.splice(objectId, 1);
    }

    static forEachProperty(object, func) {
        Object.keys(object).forEach(func);
    }

}

export default CollectionUtils;
