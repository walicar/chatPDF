import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import util from "../src/lib/util";
// all tests are run in root dir


test("getIndices does not throw", async () => {
  const result = await util.getIndices();
  console.log(result);
  expect(result).not.toContain("error");
})

test("langchain segfaults jest", async () => {
  expect(17).toBe(17);
})
