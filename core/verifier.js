
//////////////////////////////////////////////
///                 Verify                 ///    
//////////////////////////////////////////////

const { Box } = require("./utils");

class Verifier {
    constructor() {
        this.rules = {};
        this.queue = [];

        this.knownVars = [];
        this.knownFnucs = [];
        this.knownTypes = [];
    }
    join(vs, fs, ts) {
        this.knownVars.push(vs);
        this.knownFnucs.push(fs);
        this.knownTypes.push(ts);
    }
    next(node) {
        this.queue.push(node);
    }
    check(type, checker) {
        this.rules[type] = checker.bind(this);
    }
    run(box) {
        const ast = box.get();
        this.queue.push(ast);
        while(this.queue.length > 0) {
            let node = this.queue.shift();
            let rule = this.rules[node.type || node.lex_token.type] || this.rules[node.lex_token.type];
            if(!rule) {
                throw new Error(`No check rule for ${node.type || node.lex_token.type}`);
            }
            let res = rule(node);
            if(res) {
                if(!Array.isArray(res)) res = [res];
                const warns = res.filter(r => r.warn);
                const errs = res.filter(r => r.err);
                box.errors(errs);
                box.warnings(warns);
            }
        }

        return box;
    }
}

module.exports = { Verifier };
