import { ChromaHelper } from "../src/lib/chromaHelper";
import { expect } from "@jest/globals";
test("create collection", async () => { 
  const helper = new ChromaHelper();
  const create = await helper.createCollection("test");
  await helper.deleteCollection("test");
  expect(create).not.toContain("Error");
});