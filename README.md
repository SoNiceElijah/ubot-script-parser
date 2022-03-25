# Ubot script parser

![GitHub Workflow Status (branch)](https://img.shields.io/github/workflow/status/soniceelijah/ubot-script-parser/Test/main)
![npm](https://img.shields.io/npm/v/ub-script-parser)

Parser for `UBotScript`. 

```
$ npm i ub-script-parser
```

Module has no dependencies.

```js
const { go, goFromFile } = require('ubot-script-parser');

const ubotScriptStr = `
:fn fact n
    match n
        lt 0 -> concat "Error"
        0 -> 1
        _ -> n * fact (n - 1)
`;

const options = {};
const model = go(ubotScriptStr, options); // goFromFile(path, options);
```

## Document

Module contains Shift-reduce parser implementation. And Parser Combinators implementation. 

```
/core/grammar.js <- contains grammars
```

```js
const { LexNode, Lexer } = require('ub-script-parser/core/lexer');
const { GrammarReduce } = require('ub-script-parser/core/grammar');
const { ReaderFactory, defaultPreProc } = requrie('ub-script-parser/core/reader');

const lexer = new Lexer("lexer name");
lexer.add((stream) => {
    stream.trimSpaces();
    const from = stream.pos;
    const number = stream.match(/^-?\d+.?\d*/);
    if(!number) return false;
    const to = stream.pos;
    return new LexNode("number", number, from, to); 
});

const math = new GrammarReduce("grammar name");
math.with(lexer);

math.rule(([e]) => parseFloat(e), "LIT", "number");
math.rule(([e]) => e, "EXP", "LIT");
math.rule(([l,o,r]) => l + r, "EXP", "EXP", "plus", "LIT");

const model = math.run(new ReaderFactory("2 + 3 + 5 + 10", defaultPreProc), {});

model.val // 20 
```

## Licence

MIT.