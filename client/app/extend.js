'use strict';

// Utility function to extend a prototype.
// Can be used to concatenate objects of functions.
export default function(prototype, functions)
{
    if (typeof prototype !== 'object' || typeof functions !== 'object')
        throw Error(`Could not extend ${prototype} with ${functions}.`);

    for (let property in functions)
    {
        if (prototype.hasOwnProperty(property))
            throw Error(`Tried to override existing property ${property}`);

        if (functions.hasOwnProperty(property)) {
            let f = functions[property];
            if (typeof f !== 'function')
                throw Error(`Could not extend prototype with ${f}`);

            else
                prototype[property] = functions[property];
        }
    }
}
