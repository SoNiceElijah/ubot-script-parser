const { Token } = require('../core/combinators');
const { err, ret } = require('../core/utils');

////////////////////////////////////////////////
///               Combinators                /// 
////////////////////////////////////////////////

const le = new Token(function (source) { 
    source.trimSpaces();
    if(source.seek(2) === '<=') return ret('<=');
    return err("Expected <=");
});

const lt = new Token(function (source) { 
    source.trimSpaces();
    if(source.seek(1) === '<') return ret('<');
    return err("Expected <");
});

const ge = new Token(function (source) { 
    source.trimSpaces();
    if(source.seek(2) === '>=') return ret('>=');
    return err("Expected >=");
});

const gt = new Token(function (source) { 
    source.trimSpaces();
    if(source.seek(1) === '>') return ret('>');
    return err("Expected >");
});

const eq = new Token(function (source) { 
    source.trimSpaces();
    if(source.seek(2) === '==') return ret('==');
    return err("Expected ==");
});

const and = new Token(function (source) { 
    source.trimSpaces();
    if(source.seek(2) === '&&') return ret('&&');
    return err("Expected &&");
});

const or = new Token(function (source) { 
    source.trimSpaces();
    if(source.seek(2) === '||') return ret('||');
    return err("Expected ||");
});

const vtrue = new Token(function (source) { 
    source.trimSpaces();
    const res = source.match(/^true\b/)
    if(!res) return err("Exptected true val");
    return ret(res);
});


const vfalse = new Token(function (source) { 
    source.trimSpaces();
    const res = source.match(/^false\b/)
    if(!res) return err("Exptected true val");
    return ret(res);
});

const sum = new Token(function (source) { 
    source.trimSpaces();
    if(source.seek(1) === '+') return ret('+');
    return err("Expected +");
});

const sub = new Token(function (source) { 
    source.trimSpaces();
    if(source.seek(1) === '-') return ret('-');
    return err("Exptected -");
});

const mul = new Token(function (source) { 
    source.trimSpaces();
    if(source.seek(1) === '*') return ret('*');
    return err("Expected *");
});

const div = new Token(function (source) { 
    source.trimSpaces();
    if(source.seek(1) === '/') return ret('/');
    return err("Expected /");
});

const num = new Token(function (source) {
    source.trimSpaces();
    const number = source.match(/^-?[0-9]+\.?[0-9]*/);
    if(!number) return err("Expected number");
    return ret(number);
});

const valname = new Token(function (source) {
    source.trimSpaces();
    const res = source.match(/^_*[a-zA-Z]\w*/)
    if(!res) return err("Exptected varible name");
    return ret(res);
});

const leftpt = new Token(function (source) {
    source.trimSpaces();
    if(source.seek(1) === '(') return ret('(');
    return err("Expected (");
});

const rightpt = new Token(function (source) {
    source.trimSpaces();
    if(source.seek(1) === ')') return ret(')');
    return err("Expected )");
});

const string = new Token(function (source) {
    if(source.check(1) !== '"') return err("Expected string");
    source.seek(1);
    let res = "";
    const vars = [];
    let e;
    let escaped = false;
    while(((e = source.seek(1)) !== '"' || escaped) && !source.eof()) {
        if(escaped) {
            res += escapemap[e] || e;
            escaped = false;
            continue;
        }
        if(e === '\\') {
            escaped = true;
            continue;
        }
        if(e === '$') {
            const v = source.match(/^_*[a-zA-Z]\w*/);
            if(v) {
                res += `$${v}`;
                vars.push(v);
            } else {
                res += e;
            }
            continue;
        }
        res += e;
    }
    if(source.eof()) return err("Unexpected end of string");
    return ret({ value : res, vars });
});

const semicolon = new Token(function (source) {
    source.trimSpaces();
    if(source.seek(1) !== ';') return err("Expected end of line");
    return ret(";");
});

const leftblock = new Token(function (source) {
    source.trimSpaces();
    if(source.seek(1) !== '{') return err("Expected block open");
    return ret('{');
});

const rightblock = new Token(function (source) {
    source.trimSpaces();
    if(source.seek(1) !== '}') return err("Expected block end");
    return ret('}');
});

const leftarrow = new Token(function (source) {
    source.trimSpaces();
    if(source.seek(2) !== '<-') return err("Expected <-");
    return ret('<-');
});

const rightarrow = new Token(function (source) {
    source.trimSpaces();
    if(source.seek(2) !== '->') return err("Expected ->");
    return ret('->');
});

const decls = fromRegex(/^[a-zA-Z]\w*/);

function fromRegex(regex) {
    return new Token(function (source) {
        source.trimSpaces();
        const res = source.match(regex);
        if(!res) return err(`Unexpected symbols ${source.check(10)}`);
        return ret(res);
    });
};

const COMBS = {
    vtrue, vfalse,
    ge, gt, le, lt, eq, and, or,
    sum, sub, mul, div, valname, decls,
    num, leftpt, rightpt, string, semicolon,
    leftarrow, rightarrow, leftblock, rightblock,
    fromRegex
}

module.exports = { COMBS };
