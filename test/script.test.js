const assert = require('chai').assert;
const { go } = require('../index');

describe("UbotScript", () => {

    it("Can parse one function", () => {
        const script = 
`
:fn test x y
    x + y
`;

        const model = go(script, {});
        assert.isTrue(model.valid());
        assert.isFalse(model.containsWarns());
        
        const ast = model.get();
        assert.isArray(ast);
        assert.equal(ast.length, 1);

    });   

});
