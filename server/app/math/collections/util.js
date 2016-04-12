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
            while (collection.filter((e) => e.id === id).length > 0) ++id;
        }

        else if (collection instanceof Object) { // Object <-> Map
            id = Object.keys(collection).size();

            // Unicity mandatory check
            while (id in collection) ++id;
        }

        return id;
    }

}

export default CollectionUtils;