const { err } = require("./utils");

class LexNode {
    constructor(type, val, from, to) {
        this.type = type;
        this.actual_type = type;
        this.val = val;
        if(this.val && typeof this.val === 'object') {
            if(!this.val.lex_token) {
                this.val.lex_token = this;
            }
        }

        this.from = from;
        this.to = to;
    }
}

class Lexer {
    constructor(name) {
        this.name = name;
        this.components = [];
    }
    add(func) {
        this.components.push(func);
    }
    lex(stream) {
        const res = [];
        const mappers = this.components;
        while(!stream.eof()) {
            stream.trimSpaces();
            let token;
            for(const f of mappers) {
                token = f(stream);
                if(token) break; 
            }
            if(!token || token.error) return token;
            res.push(token);
            stream.trimSpaces();
        }
        this.lexems = res;
        return res;
    }
}



module.exports = { LexNode, Lexer }
