export class Environment {
    record: object;
    parent: Environment | null;
    /**
     * Creates an environment with the given record.
     */
    constructor(record = {}, parent = null) {
        this.record = record;
        this.parent = parent;
    }
    
    /**
     * Creates a variable with the given name and value
     */
    define(name, value) {
        this.record[name] = value;
        return value;
    }
    
    /**
     * Updates an existing variable.
     */
    assign(name, value) {
        this.resolve(name).record[name] = value;
        return value;
    }

    /**
     * Returns the value of a defined variable or throws
     * if the variable is not defined
     */
    lookup(name) {
        return this.resolve(name).record[name];
    }
    
    /**
     * Returns specific enviroment in which a variable is defined, or
     * throws if a variable is not defined.
     */
    resolve(name) {
        if(this.record.hasOwnProperty(name)) {
            return this;
        }
        // if we reach the global env
        if (this.parent === null) {
            throw new ReferenceError(`Variale "${name}" is not defined.`)
        }
        return this.parent.resolve(name);
    }
}