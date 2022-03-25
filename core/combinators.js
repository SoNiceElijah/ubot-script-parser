////////////////////////////////////////////////
///            Combinator atoms              /// 
////////////////////////////////////////////////

Array.prototype.top = function () {
    return this[this.length-1];
};

function emptynext() {
    return false;
}

class Token {
    constructor(func) {
        this.func = func;
        this.type = 'atom';
    }
    make(stream) {
        return { name : this.name, stream, res: { }, content : [], next : emptynext, type : this.type, resolve : this.func };
    }
}

class Alternative {
    constructor() {
        this.parsers = [];
        this.type = 'alternative';
    }
    or(parser) {
        if(parser.type === 'alternative') {
            for(const p of parser.parsers)
                this.parsers.push(p);
        }
        else {
            this.parsers.push(parser);
        }       
        return this;
    }
    make(stream) {
        if(!this.parsers.length)
            throw new Error("No functions in alternative...");
        const parsers = this.parsers;
        function next() {
            ++this.state;
            if(this.state === parsers.length) return false;
            const newone = parsers[this.state].make(this.stream);
            for(const key of Object.keys(newone)) {
                if(key === 'next') continue;
                if(key === 'state') continue;
                this[key] = newone[key];
            }
            return true;
        }
        const ctx = { name : this.name, stream, next, state : -1 };
        ctx.next();
        return ctx;
    }
}

class Monad {
    constructor(agregate) {
        this.parsers = [];
        this.type = 'monad';
        this.agregate = agregate;
    }
    then(parser) {
        this.parsers.push(parser);
        return this;
    }
    make(stream) {
        if(!this.parsers.length)
            throw new Error("No functions in monad...");
        return { name : this.name, stream, resolve : this.agregate, res: [], next : emptynext, type : this.type, content : [...this.parsers] };
    }
}

module.exports = { 
    Monad, Token, Alternative
};
