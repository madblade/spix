/**
 *
 */

'use strict';

class CollectionUtils {

    static generateId(collection) {
        // TODO generate random ids.
        var id = -1;

        if (collection instanceof Array) { // Array
            id = collection.length;

            // Unicity mandatory check
            var f = ((e) => e.id === id);
            while (collection.filter(f).length > 0) ++id;
        }

        else if (collection instanceof Object) { // Object <-> Map
            id = CollectionUtils.numberOfProperties(collection);

            // Unicity mandatory check
            while (id in collection) ++id;
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

}

export default CollectionUtils;
