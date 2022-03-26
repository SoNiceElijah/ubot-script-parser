const { GrammarReduce } = require('../core/grammar');

//////////////////////////////////////////////
///                 Mappers                ///
////////////////////////////////////////////// 

function id ([s]) {return s; };
function id2 ([s,e]) {return [s,e]; };
function binmap([l,op,r]) {
    return {
        type : 'binop',
        op : op,
        left : l,
        right : r
    }
}
function assmap([w,_s,s]) {
    return {
        type : 'assignment',
        left : w,
        right : s
    }
}
function callmap([c, v]) {
    c.args.push(v);
    return c;
}
function callppmap([c, _s, v, __s]) {
    c.args.push(v);
    return c;
}
function callinitmap([c, v]) {
    return {
        type : 'call',
        caller : c,
        args: [v]
    }
}
function callinitppmap([c, _s, v, __s]) {
    return {
        type : 'call',
        caller : c,
        args: [v]
    }
}
function permap([_p, s, __p]) {
    return s;
}
function blockmap([_b, s, __b]) {
    return s;
}
function stateinit([s]) {
    return [s];
}
function statearr([sl,_s,sr]) {
    sl.push(sr);
    return sl;
}
function casemap([pa, _r, s]) {
    return {
        type : 'case',
        value : pa,
        actions : [s]
    }
}
function caseblockmap([pa, _r , s]) {
    return {
        type : 'case',
        value : pa,
        actions : s
    }
}
function kamp([s, e]) {
    return s;
}
function matchmap([d, _b, s, __b]) {
    if(d.type !== 'call') return { type : 'unknown' };
    return {
        type : d.caller.value,
        by : d.args[0],
        cases : s
    }
}
function bigmap([h, c, b, __s]) {
    if(c.type !== 'call') return { type : 'unknown' };
    return {
        type : 'block',
        header : h,
        decl : {
            name : c.caller,
            args : c.args
        },
        body : b
    }
}
function typemap([h, c, b, __s]) {
    if(c.type !== 'call' && c.type !== 'varible') return { type : 'unknown' };
    return {
        type : 'block',
        header : h,
        decl : {
            name : 'type',
            struct : c.type === 'call' ? c.caller : c,
            args : c.args || []
        },
        body : b
    }
}
function bigdeclmap([pack, __s]) {
    return {
        type : 'block_decl',
        header : pack[0],
        decl : pack[1],
    }
}
function blistinit([b]) {
    return [b];
}
function blistmap([l,b]) {
    l.push(b);
    return l;
}
function recmap([w, _d, e]) {
    return {
        key : w.value,
        value : e
    }
}
function rinitmap([r]) {
    const dict = { type : 'dict', mem : {} };
    return rlstmap([dict, null, r]);
}
function rlstmap([d, _d, r]) {
    dict = d.mem;
    if(r.value.type == 'dict') {
        dict[r.key] = r.value;
    } else if(r.value.type === 'varible') {
        dict[r.key] = { type : 'template', value : r.value.value }
    } else {
        dict[r.key] = { type : 'asis', value : r.value.value }
    }

    return d;
}
function lammap([c,_gh,s]) {
    return lammbigap([c, _gh, [s]]);
}
function lammbigap([c,_gh,s]) {
    const args = [];
    if(c.type === 'call') {
        args.push(c.caller);
        for(const a of c.args) {
            args.push(a);
        }
    } else {
        args.push(c);
    }
    return {
        type : 'lambda',
        decl : { args },
        body : s
    }
}

//////////////////////////////////////////////
///                 Grammar                ///
////////////////////////////////////////////// 

const ubot = new GrammarReduce("ubot");

ubot.rule(blistinit, 'blocks', 'big_block');
ubot.rule(blistmap, 'blocks', 'blocks', 'big_block');

ubot.rule(id, 'block_inner_wrapper', 'block_inner');
ubot.rule(bigmap, 'big_block', 'header', 'call', 'block_inner_wrapper', 'sc');
ubot.rule(typemap, 'big_block', 'header', 'call', 'data_record_block', 'sc');

ubot.rule(id2, 'big_block_left', 'header', 'string');
ubot.rule(bigdeclmap, 'big_block', 'big_block_left', 'sc');

ubot.rule(blockmap, "block_inner", "lb", "statements", "rb");

ubot.rule(stateinit, "statements", "statement");
ubot.rule(statearr, "statements", "statements", "sc", "statement");

ubot.rule(id, "val", "number");
ubot.rule(permap, "val", "lp","exp", "rp");

ubot.rule(permap, "call_in", "lp", "exp", "rp");
ubot.rule(id, "call_in", "word");
ubot.rule(id, "call", "call_in");

ubot.rule(callinitmap, "call", "call_in", "number");
ubot.rule(callinitppmap, "call", "call_in", "lp","exp", "rp");
ubot.rule(callinitmap, "call", "call_in", "word");
ubot.rule(callinitmap, "call", "call_in", "string");
ubot.rule(callinitmap, "call", "call_in", "boolean");
ubot.rule(callinitmap, "call", "call_in", "otherwise");

ubot.rule(callmap, "call", "call", "number");
ubot.rule(callppmap, "call", "call", "lp","exp", "rp");
ubot.rule(callmap, "call", "call", "word");
ubot.rule(callmap, "call", "call", "string");
ubot.rule(callmap, "call", "call", "boolean");
ubot.rule(callmap, "call", "call", "otherwise");

ubot.rule(id, "product", "val");
ubot.rule(id, "product", "call");
ubot.rule(binmap, "product", "product", "op_5", "val");
ubot.rule(binmap, "product", "product", "op_5", "call");

ubot.rule(id, "sum", "product");
ubot.rule(binmap, "sum", "sum", "op_4", "product");

ubot.rule(id, "cmp", "sum");
ubot.rule(id, "cmp", "boolean");
ubot.rule(binmap, "cmp", "sum", "op_3", "sum");
ubot.rule(binmap, "cmp", "boolean", "op_3", "sum");
ubot.rule(binmap, "cmp", "sum", "op_3", "boolean");
ubot.rule(binmap, "cmp", "boolean", "op_3", "boolean");

ubot.rule(id, "and", "cmp");
ubot.rule(binmap, "and", "and", "op_2", "cmp");

ubot.rule(id, "or", "and");
ubot.rule(binmap, "or", "or", "op_1", "and");

ubot.rule(id, "exp", "or");
ubot.rule(assmap, "ass", "word", "la", "string");
ubot.rule(assmap, "ass", "word", "la", "exp");
ubot.rule(assmap, "ass", "word", "la", "match_block");
ubot.rule(assmap, "ass", "word", "la", "lambda");

ubot.rule(id, "statement", "exp");
ubot.rule(id, "statement", "ass");
ubot.rule(id, "statement", "match_block");
ubot.rule(id, "statement", "lambda");

ubot.rule(id, "else", "otherwise");
ubot.rule(id, "string_case", "string");

ubot.rule(casemap, "case", "string_case", "ra", "statement");
ubot.rule(casemap, "case", "exp", "ra", "statement");
ubot.rule(casemap, "case", "else", "ra", "statement");

ubot.rule(caseblockmap, "case", "string_case", "ra", "block_inner");
ubot.rule(caseblockmap, "case", "exp", "ra", "block_inner");
ubot.rule(caseblockmap, "case", "else", "ra", "block_inner");

ubot.rule(stateinit, 'cases', 'case');
ubot.rule(statearr, 'cases', 'cases', 'sc','case');

ubot.rule(matchmap, 'match_block', 'call', 'lb', 'cases', 'rb');

ubot.rule(recmap, 'data_record', 'word', 'dd', 'word');
ubot.rule(recmap, 'data_record', 'word', 'dd', 'boolean');
ubot.rule(recmap, 'data_record', 'word', 'dd', 'number');
ubot.rule(recmap, 'data_record', 'word', 'dd', 'string');
ubot.rule(recmap, 'data_record', 'word', 'dd', 'data_record_block');

ubot.rule(rinitmap, 'data_records', 'data_record');
ubot.rule(rlstmap, 'data_records', 'data_records', 'sc', 'data_record');

ubot.rule(blockmap, 'data_record_block', 'lb', 'data_records', 'rb');

ubot.rule(lammap, "lambda", "call", "gh", "statement");
ubot.rule(lammbigap, "lambda", "call", "gh", "block_inner");

module.exports = ubot;
