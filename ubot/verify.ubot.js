const { Verifier } = require('../core/verifier');

//////////////////////////////////////////////
///                 Verifier               ///
////////////////////////////////////////////// 

const ubot = new Verifier();

ubot.check('blocks', function (node) {

    if(!Array.isArray(node)) {
        return { node, err : "Blocks not array...."};
    }
    for(const n of node) {
        this.next(n);
    }

    // good
    return false;
});

ubot.check('unknown', function (node) {
    return { node, err : "Uknown semantic"};
});

const headers = [
    ":main",
    ":fn",
    ":decl"
];
ubot.check('block', function (node) {

    const hval = node.header.value;
    const hnode = node.header;

    const msgs = [];

    if(!headers.includes(hval)) {
        return { node : hnode, err : `Unknown header ${hval}` };
    }
    if(hval !== ':decl') {
        node.decl.name.lex_token.actual_type = "decl_fn_name";
        for(const arg of node.decl.args) {
            if(arg.type !== 'varible' && arg.type !== 'otherwise') {
                msgs.push({node : arg, err : `Unsupported function argument declaration [${arg.type}]` });
            }
            arg.lex_token.actual_type = "decl_fn_argument";
        }
    } else {
        node.decl.struct.lex_token.actual_type = "decl_type_name";
        if(!(node.decl.struct.value[0] >= 'A' && node.decl.struct.value[0] <= 'Z')) {
            msgs.push({ node : node.decl.struct, warn : `We assume, that type starts with upper case letter, hope u know what u r doing...`});
        }
        for(const arg of node.decl.args) {
            if(arg.type !== 'varible') {
                msgs.push({ node : arg, err : `Unsupported type argument declaration [${arg.type}]`});
            }
            arg.lex_token.actual_type = "decl_type_argument";
        }
    }

    if(Array.isArray(node.body)) {
        for(const b of node.body) {
            this.next(b);
        }
    } else {
        this.next(node.body);
    }

    if(msgs.length) 
        return msgs;
    return false;

});

ubot.check('block_decl', function (node) {
    if(node.header.value !== ':use') {
        return { node : node.header, err : `Unknown import header ${node.header.value}` }
    }

    if(node.decl.vars.length) {
        return { node : node.decl, err : `No pattern string allowed` }
    }

    return false;
});

ubot.check('assignment', function (node) {
    if(node.left.type !== 'varible') {
        return { node : node.left, err : `Assignment to somthing wierd...` }
    }

    this.next(this.right);    
    return false;
});

ubot.check('assignment', function (node) {
    if(node.left.type !== 'varible') {
        return { node : node.left, err : `Assignment to somthing wierd...` }
    }

    this.next(node.right);    
    return false;
});

ubot.check('binop', function (node) {
    this.next(node.left);    
    this.next(node.right);    
    return false;
});

ubot.check('call', function (node) {
    node.caller.lex_token.actual_type = "fn_call";
    for(const arg of node.args) {
        this.next(arg);
    }
    return false;
});

ubot.check('match_block', function (node) {
    if(node.type !== 'match') {
        return { node, err : `Unknown inner block ${node.type}` }
    }

    const warns = [];
    if(node.by.type !== 'varible') {
        warns.push({ node : node.by, warn : `We recommend use varible, hope u know what u r doing` });
    }

    let otherwise = false;
    for(let c of node.cases) {
        if(c.value.type === 'otherwise') {
            otherwise = true;
        }
        this.next(c);
    }

    if(!otherwise) {
        warns.push({ node, warn : `Pattern can be not exhaustive` });
        return warns;
    }

    return false;
});

ubot.check('case', function (node) {
    this.next(node.value);
    for(const a of node.actions) {
        this.next(a);
    }

    return false;
});

ubot.check('case', function (node) {
    this.next(node.value);
    for(const a of node.actions) {
        this.next(a);
    }

    return false;
});

function pass() { return false; }
ubot.check('dict', pass);
ubot.check('pattern', pass);
ubot.check('literal', pass);
ubot.check('boolean', pass);
ubot.check('varible', pass);
ubot.check('otherwise', pass);

module.exports =  ubot;