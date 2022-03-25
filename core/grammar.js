const { Monad, Alternative } = require('./combinators');
const { LexNode } = require('./lexer');
const { ret, err, Box } = require('./utils');

class GrammarComb {
    constructor(name, ...grammars) {
        this.name = name;
        this.dictionary = {};
        this.grammars = grammars;
    }
    rule(mapper, name, ...rules) {
        if(!this.dictionary[name]) {
            this.dictionary[name] = [];
        }        
        this.dictionary[name].push({ m : mapper, r : rules });
    }
    import(...grammars) {
        for(const g of grammars) {
            for(const name in g.dictionary) {
                for(const item of g.dictionary[name])
                    this.rule(item.m, name, ...item.r);
            }
        }
    }
    build() {
        const builded = {};
        for(const gr of this.grammars) {
            builded[gr.name] = gr.build();
        };

        for(const rule in this.dictionary) {
            if(this.dictionary[rule].length === 1) {
                builded[rule] = new Monad(this.dictionary[rule][0].m);
            } else {
                builded[rule] = new Alternative();
            }
            builded[rule].name = rule;
        }
        for(const rule in this.dictionary) {
            if(this.dictionary[rule].length === 1) {
                for(const key of this.dictionary[rule][0].r) {
                    let parser = key;
                    if(typeof(key) === 'string') parser = builded[key];
                    if(!parser) throw new Error(`Unknown grammar rule "${key}"`);
                    builded[rule].then(parser);
                }
            } else {
                const mons = [];
                for(const rec of this.dictionary[rule]) {
                    const mon = new Monad(rec.m);
                    for(const key of rec.r) {
                        let parser = key;
                        if(typeof(key) === 'string') parser = builded[key];
                        if(!parser) throw new Error(`Unknown grammar rule "${key}"`);
                        mon.then(parser);
                    }
                    mons.push(mon);
                }
                for(const m of mons) {
                    builded[rule].or(m);
                }
            }
        }

        if(!builded[this.name]) throw new Error(`Unknown root "${this.name}"`);
        return builded[this.name];
    }
    run(factory, options) {
        const root = this.build();
        const meta = {};

        meta.branch = 0;
        meta.end = 0;

        meta.backward = 0;
        meta.forward = 0;
        
        meta.stream = factory.create();

        const stack = [];
        stack.push({ res : [] });
        stack.push(root.make(meta.stream.fork()));
        while(stack.length > 1) {

            if(stack.top().res.error) {
                if(stack.top().next()) {
                    ++meta.branch;
                    meta.stream = stack.top().stream.fork();
                    continue;
                } else {
                    ++meta.backward;
                    const { res } = stack.pop();
                    stack.top().res = res;
                }
                continue;
            }
            ++meta.forward;
            if(stack.top().type === 'atom') {
                const atom = stack.pop();
                const res = atom.resolve(meta.stream);
                if(res.error) {
                    ++meta.end;
                    atom.res = res;
                    stack.push(atom);
                    continue;
                }
                else {
                    stack.top().res.push(res);
                    continue;
                }
            }
            if(!stack.top().content.length) {
                const { resolve, res } = stack.pop();
                stack.top().res.push(resolve(res));
                continue;
            }

            let parser = stack.top().content.shift();
            stack.push(parser.make(meta.stream.fork()));
        }

        if(!meta.stream.eof() && !stack[0].res.error) return err("Unexpected end of file...");
        return stack[0].res;
    }
}

class GrammarReduce {
    constructor(name, lexer) {
        this.name = name;
        this.dictionary = {};
        this.lookup = {};
        this.lexer = lexer;
    }
    with(lexer) {
        this.lexer = lexer;
    }
    import(...grammars) {
        for(const g of grammars) {
            for(const name in g.dictionary) {
                for(const item of g.dictionary[name])
                    this.rule(item.m, name, ...item.r);
            }
        }
    }
    rule(mapper, name, ...rules) {
        if(!this.dictionary[name]) {
            this.dictionary[name] = [];
        }
        for(let i = 0; i < rules.length - 1; ++i) {
            if(!this.lookup[rules[i]])
                this.lookup[rules[i]] = [];
            this.lookup[rules[i]].push(rules[i + 1]);
        }
        this.dictionary[name].push({ m : mapper, r : rules });
    }
    build() {
        const make = () => { return { type : 'node' }; };
        const dict = make();
        for(const name in this.dictionary) {
            for(const { m, r } of this.dictionary[name]) {
                if(!r.length) throw new Error(`Rule ${name} with zero length!!!`);
                let fin = dict;
                for(let i = r.length - 1; i > 0; --i) {
                    if(!fin[r[i]])
                        fin[r[i]] = make();
                    fin = fin[r[i]];
                }
                if(!fin[r[0]]) {
                    fin[r[0]] = { resolve : m, name : name, type : 'leaf' };
                } else {
                    fin[r[0]].resolve = m;
                    fin[r[0]].name = name;
                    fin[r[0]].type = 'leaf';
                } 
                
            }
        }
        return dict;
    }
    run(factory, options) {

        const stream = factory.create();
        const tokens = this.lexer.lex(stream);
        const dict = this.build();
        const stack = [];

        const meta = {};
        meta.tokens = tokens;
        meta.factory = factory;

        const box = new Box();
        box.meta(meta);

        const lookuptable = {...this.lookup};
        function lookup(last, token) {
            if(!last) return false;
            const val = lookuptable[last.type];
            if(!val) return false;
            return val.includes(token.type);
        }

        function reduceonce(st, di) {
            let reducer = di;
            let j = st.length - 1;
            let size = st.length - 1;
            let reds;
            while(reducer && j >= 0) {
                reducer = reducer[st[j].type];
                if(reducer && reducer.type === 'leaf')
                {
                    reds = reducer;
                    size = j - 1;
                }
                --j;
            }

            reducer = reds;
            if(reducer && reducer.type === 'leaf') {
                const arr = [];
                while(st.length - 1 != size) {
                    arr.push(st.pop());
                }
                const redex = reducer.resolve(arr.reverse().map(e => e.val));
                st.push(new LexNode(reducer.name, redex, arr[0].from, arr[arr.length-1].to));
                return true;
            }

            return false;
        }

        if(tokens.error) {
            return box.errors(tokens.getErrs());
        }
        for(const t of tokens) {
            while(!lookup(stack[stack.length - 1],t) && reduceonce(stack, dict));
            stack.push(t);
        }
        while(reduceonce(stack, dict));

        if(stack.length > 1) {
            return box.errors({ node : stack[stack.length - 1], err : "Parse error!" })
        }
        return box.put(stack[0].val);
    }
}

module.exports = { GrammarComb, GrammarReduce };
