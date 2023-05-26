import { ChromaHelper } from "../src/lib/ChromaHelper";
import { expect } from "@jest/globals";
import { util } from "../src/lib/util.js";

test.skip("create embeddings with collection", async () => {
  const helper = new ChromaHelper();
  const name = "exist";
  const texts = await util.getTexts("./tests/test.pdf");
  await helper.deleteCollection(name);
  const store = await helper.createEmbeddings(texts, name);
  const result = await helper.queryDoc("What is OpenAI?");
  console.log(result);
  expect(result).toContain("OpenAI");
  await helper.deleteCollection(name);
}, 15000);
