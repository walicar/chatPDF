import { util } from "../src/lib/util.js";
// all tests are run in root dir

/*
test("getIndices does not throw", async () => {
  expect(async () => {await util.getIndices()}).not.toThrow();
})
*/

test("getTexts does not fail", async () => {
  const result = await util.processTexts("tests/test.pdf");
  expect(result.length).toBe(7);
});

test("merge works correctly", () => {
  const a = ["apple", "orange"];
  const b = ["banana", "apple"];
  const result = util.merge(a, b);
  expect(result).toEqual(["apple", "orange", "banana"]);
});
