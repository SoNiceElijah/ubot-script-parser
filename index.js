const ulexer = require('./ubot/lexer.ubot');
const ugrammar = require('./ubot/grammar.ubot');
const uverify = require('./ubot/verify.ubot');

const { err } = require('./core/utils');

const fs = require('fs');

const { countSpaces, makeFlatten, ReaderFactory } = require('./core/reader');

function go(string, options) {
    const factory = new ReaderFactory(string, (str) => { 
        const text_pre = countSpaces(str);
        return makeFlatten(text_pre);
    });

    ugrammar.with(ulexer);
    const model = ugrammar.run(factory, options);
    if(!model.valid()) {
        return model;
    }

    const validated = uverify.run(model);
    return validated;
}

function goFromFile(path, options) {
    if(!fs.existsSync(path)) return err(`File not found ${path}`);
    const text = fs.readFileSync(path,'utf-8');
    return go(text, options).meta({ file : path });
}

module.exports = { go, goFromFile };
