import { util } from "../src/lib/util.js";
// all tests are run in root dir

/*
test("getIndices does not throw", async () => {
  expect(async () => {await util.getIndices()}).not.toThrow();
})
*/

test("getTexts does not fail", async () => {
  const result = await util.getTexts("tests/test.pdf");
  expect(result.length).toBe(17);
})

