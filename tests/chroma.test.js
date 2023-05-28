import { ChromaHelper } from "../src/lib/ChromaHelper";
import { expect } from "@jest/globals";
import { util } from "../src/lib/util.js";

test.skip("create embeddings with collection", async () => {
  const helper = new ChromaHelper();
  const name = "exist";
  const texts = await util.getTexts("./tests/test.pdf");
  await helper.deleteDocument(name);
  const store = await helper.createDocument(texts, name);
  const result = await helper.queryDocument("What is OpenAI?");
  console.log(result);
  expect(result).toContain("OpenAI");
  await helper.deleteDocument(name);
}, 15000);
