const assert = require('chai').assert;
const { go } = require('../index');

describe("UbotScript", () => {

    const oneblocks = [
[
"Can parse one function",
`
:fn test x y
    x + y
`
],
[
"Can parse type declaration without params",
`
:decl Type1
    type : "example"
`
],
[
"Can parse type declaration with params",
`
:decl Type1 x y
    type : "example"
    name : x
    age : y

`
],
[
"Can parse function with one line lambda",
`
:fn foo x
    y => x

`
],
[
"Can parse function with muliline lambda",
`
:fn foo x
    y => 
        z <- x * x
        z - 10

`
],
[
"Can parse function with nested lambda",
`
:fn foo x
    y => z => y
`
],
[
"Can parse main function",
`
:main func_name args
    put args
`
],
[
"Can parse assignment statement",
`
:main main args
    x <- 3
`
],
[
"Can parse match [one line | otherwise] statement with one case",
`
:main func_name args
    match x
        _ -> true

`
],
[
"Can parse match [one line | otherwise & number] statement with mutli case",
`
:main func_name args
    match x
        3 -> true
        _ -> false

`
],
[
"Can parse match [multiline | otherwise] statement with one case",
`
:main func_name args
    match x
        _ -> 
            x <- false
            put x

`
],
[
"Can parse match [multiline | otherwise & number] statement with multi case",
`
:main func_name args
    match x
        3 ->
            str <- "fsdfsdfsd"
            put (concat str)
        _ -> 
            x <- false
            put x

`
],
[
"Can parse match [one line & multiline | otherwise & number] statement with multi case",
`
:main func_name args
    match x
        3 -> concat "test"
        _ -> 
            x <- false
            put x

`
]
    ];
    function oneBlockTest([name, script]) {
        it(name, () => {
            const model = go(script, {});
            assert.isTrue(model.valid());
            assert.isFalse(model.containsWarns());
            
            const ast = model.get();
            assert.isArray(ast);
            assert.equal(ast.length, 1);
        }) 
    }

    for(const block of oneblocks) {
        oneBlockTest(block);
    }

});
