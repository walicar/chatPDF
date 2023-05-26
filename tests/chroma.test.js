import { ChromaHelper } from "../src/lib/chromaHelper";
import { expect } from "@jest/globals";
import { util } from "../src/lib/util.js";

test("create embeddings with collection", async () => {
  const helper = new ChromaHelper();
  const name = "exist";
  const texts = await util.getTexts("./tests/camby.pdf");
  await helper.deleteCollection(name);
  const store = await helper.createEmbeddings(texts, name);
  const result = await helper.queryDoc("What is life?");
  console.log(result);
  expect(result).toBe("OK!");
  await helper.deleteCollection(name);
}, 15000);
