const assert = require('chai').assert;
const { goFromFile } = require('../index');

const path = require('path');

describe("New feature test", () => {
    it("Can load and parse script with import", () => {

        const model = goFromFile(path.resolve(__dirname, 'test.ubot'), {});
        // model.printDebug();

        console.log(model.valid());
        console.log(model.iterateErrs(e => console.log(e)));
        assert.isTrue(model.valid());
        assert.isFalse(model.containsWarns());

    });
});
