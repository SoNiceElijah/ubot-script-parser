const util = require('util');

/////////////////////////////////////////
///            Data container         ///
/////////////////////////////////////////

class Box {
    constructor() {
        this.value = [];
        this.errs = [];
        this.warns = [];
        this.metas = {};
    }
    put(value) {
        this.value[0] = value;
        return this;
    }
    errors(err) {
        if(!Array.isArray(err)) err = [err];
        for(const e of err) {
            this.errs.push(e);
        }
        this.error = true;
        return this;
    }
    warnings(warn) {
        if(!Array.isArray(warn)) warn = [warn];
        for(const w of warn) {
            this.warns.push(w);
        }
        
        return this;
    }
    meta(m) {
        for(let key in m) {
            this.metas[key] = m[key];
        }
        return this;
    } 
    get() {
        return this.value[0];
    }
    getErrs() {
        return this.errs;
    }
    getWarns() {
        return this.warns;
    }
    getNotes() {
        const arr = [];
        for(const e of this.errs) {
            arr.push(e);
        }
        for(const w of this.warns) {
            arr.push(w);
        }
        return arr;
    }
    getMeta() {
        return this.metas;
    }
    containsVal() {
        return this.value.length !== 0;
    }
    containsError() {
        return this.errs.length !== 0;
    }
    containsWars() {
        return this.warns.length !== 0;
    }
    containsMeta() {
        return true;
    }
    valid() {
        return this.containsVal() && !this.containsError();
    }
    printDebug(what) {

        if(!what) {
            console.log("VALUE:");
            console.log(util.inspect(this.get(), false, null, true));
            console.log("NOTES:");
            console.log(util.inspect(this.getNotes(), false, null, true));
        }
        else if(what === 'value') {
            console.log(util.inspect(this.get(), false, null, true));
        }
        else if(what === 'errors') {
            console.log(util.inspect(this.errors(), false, null, true));
        } 
        else if(what === 'warnings') {
            console.log(util.inspect(this.warnings(), false, null, true));
        } else {
            console.log("....");
        }
    }
    iterateErrs(func) {
        const g = func.bind(this);
        for(const e of this.getNotes()) {
            g(e);
        }
    }
}

function ret(content) {
    const b = new Box();
    b.put(content);
    return b;
}

function err(msg) {
    const b = new Box();
    b.errors(msg);
    return b;
}

module.exports = { Box, ret, err };
