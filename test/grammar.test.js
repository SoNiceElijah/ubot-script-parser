const assert = require('chai').assert;
const { GrammarReduce } = require('../core/grammar');
const { Lexer, LexNode } = require('../core/lexer');
const { ReaderFactory } = require('../core/reader');

describe("Grammars", () => {

    it("Can initilize reduce grammar", () => {
        const lexer = new Lexer("number_and_plus_only");
        lexer.add((stream) => {
            stream.trimSpaces();
            const pos = stream.pos;
            const number = stream.match(/^-?\d+.?\d*/);
            if(!number) return false;
            return new LexNode("number", number, pos, stream.pos);
        });
        lexer.add((stream) => {
            stream.trimSpaces();
            const pos = stream.pos;
            if(stream.check(1) !== '+') return false;
            stream.seek(1);
            return new LexNode("plus", "+", pos, stream.pos);
        });

        const grammar = new GrammarReduce("plus_only");
        grammar.with(lexer);

        grammar.rule(([e]) => parseFloat(e), "LIT", "number");
        grammar.rule(([e]) => e, "EXP", "LIT");
        grammar.rule(([left, plus, right]) => left + right, "EXP", "EXP", "plus", "LIT");

        const string = "1 + 2 + 3 + 4";
        const model = grammar.run(new ReaderFactory(string), {});

        assert.isTrue(model.valid());
        assert.equal(model.get(), 10);
    });    

});
