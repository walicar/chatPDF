import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
// all tests are run in root dir

/*
test("getIndices does not throw", async () => {
  expect(async () => {await util.getIndices()}).not.toThrow();
})
*/

test("getTexts does not fail", async () => {
  const loader = new PDFLoader("./tests/test.pdf");
  const doc = await loader.load();
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 20,
  });
  const docs = await splitter.splitDocuments(doc);
  console.log("HELLO?");
  console.log(docs.length);
  expect(docs.length).toBe(17);
})


test("langchain segfaults jest", async () => {
  expect(14).toBe(17);
})
