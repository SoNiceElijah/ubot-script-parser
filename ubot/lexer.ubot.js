const { LexNode, Lexer } = require('../core/lexer');
const { err } = require('../core/utils');

//////////////////////////////////////////////
///                 LexFuncs               ///
////////////////////////////////////////////// 

const spec = {
    '*' : new LexNode("op_5",'*'),
    '/' : new LexNode("op_5",'/'),
    '+' : new LexNode("op_4",'+'),
    '-' : new LexNode("op_4",'-'),
    '>' : new LexNode("op_3",'>'),
    '<' : new LexNode("op_3",'<'),
    '==' : new LexNode("op_3",'=='),
    '>=' : new LexNode("op_3",'>='),
    '<=' : new LexNode("op_3",'<='),
    '&&' : new LexNode("op_2",'&&'),
    '||' : new LexNode("op_1",'||'),
    '<-' : new LexNode("la", '<-'),
    '->' : new LexNode("ra", '->'),
    '(' : new LexNode('lp', '('),
    ')' : new LexNode('rp', ')'),
    ';' : new LexNode('sc', ';'),
    '{' : new LexNode('lb', '{'),
    '}' : new LexNode('rb', '}'),
    ':' : new LexNode('dd', ':'),
    '=>' : new LexNode('gh', ':')
}

function isOp(stream) {
    const oneSymb = spec[stream.check(1)];
    const twoSymb = spec[stream.check(2)];
    if(twoSymb) {
        twoSymb.from = stream.pos;
        stream.seek(2);
        twoSymb.to = stream.pos - 1;
        return twoSymb;
    } 
    if(oneSymb) {
        oneSymb.from = stream.pos;
        stream.seek(1);
        oneSymb.to = stream.pos - 1;
        return oneSymb;
    }
    return false;
}

function isWord(stream) {
    const pos = stream.pos;
    const word = stream.match(/^_*[a-zA-Z]\w*/);
    if(!word) return false;
    return new LexNode("word", { type : 'varible' , value : word }, pos, stream.pos - 1);
}

function isNumber(stream) {
    const pos = stream.pos;
    const number = stream.match(/^-?[0-9]+\.?[0-9]*/);
    if(!number) return false;
    return new LexNode("number", { type : 'literal', value : parseFloat(number)}, pos, stream.pos - 1);
}

function isHeader(stream) {
    const pos = stream.pos;
    const header = stream.match(/^:\w+/);
    if(!header) return false;
    return new LexNode("header", { type : 'header', value  : header }, pos, stream.pos - 1);
}

const escapemap = {
    'n' : '\n',
    't' : '\t',
    'r' : '\r',
    '"' : '"',
    '\'' : '\'',
    '$' : '$',
    '\\' : '\\'
}
function quotedString(q) {
    return function(stream) {
        const pos = stream.pos;
        if(stream.check(1) !== q) return false;
        stream.seek(1);
        let res = "";
        const vars = [];
        let e;
        let escaped = false;
        while(((e = stream.seek(1)) !== q || escaped) && !stream.eof()) {
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
                const v = stream.match(/^_*[a-zA-Z]\w*/);
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
        if(stream.eof()) return err("Unexpected end of string");
        return new LexNode("string", { type : 'pattern', value : res, vars }, pos, stream.pos - 1);
    }
}
function isOtherwise(stream) {
    const pos = stream.pos;
    const otherwise = stream.match(/^_+/);
    if(!otherwise) return false;
    return new LexNode("otherwise", { type : 'otherwise', value : otherwise}, pos, stream.pos - 1);
}

function isBoolean(stream) {
    const pos = stream.pos;
    const boolean = stream.match(/^(true|false)/);
    if(!boolean) return false;
    return new LexNode("boolean", { type : 'boolean', value : boolean === 'true' }, pos, stream.pos - 1);
}

//////////////////////////////////////////////
///                   Lexer                ///
////////////////////////////////////////////// 

const ubot = new Lexer("ubot");

ubot.add(isNumber);
ubot.add(isHeader);
ubot.add(isOp);
ubot.add(isBoolean);
ubot.add(isWord);
ubot.add(quotedString("\""));
ubot.add(quotedString("'"));
ubot.add(isOtherwise);

module.exports = ubot;
