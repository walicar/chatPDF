import { PineconeHelper } from "../src/lib/PineconeHelper.js";
import { describe, expect } from "@jest/globals";
import { util } from "../src/lib/util.js";

test("placeholder", async () => {
  expect(7).toBe(7);
});

test.skip("getIndices", async () => {
  const helper = new PineconeHelper();
  const indices = await helper.getIndices();
  expect(indices).toEqual(["world"]);
}, 10000)

test.skip("describeIndex", async () => {
  const helper = new PineconeHelper();
  const result = await helper.describeIndex("world");
  expect(result.database.name).toEqual("world");
}, 10000)

test("pollIndex", async () => {
  const helper = new PineconeHelper();
  const result = await helper.poll("world");
  expect(result).toEqual(true);
}, 20000)
