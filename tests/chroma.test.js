import { ChromaHelper } from "../src/lib/chromaHelper";
import { expect } from "@jest/globals";
import { util } from "../src/lib/util.js";

test.skip("create embeddings with collection", async () => {
  const helper = new ChromaHelper();
  const name = "exist";
  const texts = await util.getTexts("./tests/test.pdf");
  await helper.deleteCollection(name);
  const store = await helper.createEmbeddings(texts, name);
  const result = await helper.queryDoc("What is openAI?");
  console.log(result);
  expect(result).toBe("OK!");
  await helper.deleteCollection(name);
}, 15000);
