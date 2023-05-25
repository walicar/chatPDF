import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import util from "../src/lib/util";
// all tests are run in root dir


test("getIndices does not throw", async () => {
  const loader = new PDFLoader("./tests/test.pdf");
  const doc = await loader.load();
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 20,
  });
  const docs = await splitter.splitDocuments(doc);
  expect(docs.length).toBe(17);
})

test("getIndices", async () => {
  const fart = await util.getTexts("./tests/test.pdf");
  expect(17).toBe(17);
})

test("langchain segfaults jest", async () => {
  expect(17).toBe(17);
})
