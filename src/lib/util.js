import * as dotenv from "dotenv";
dotenv.config();
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import fs from "fs/promises";

export async function processTexts(path) {
  try {
    const loader = new PDFLoader(path);
    const doc = await loader.load();
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 20,
    });
    const docs = await splitter.splitDocuments(doc);
    return docs.map((d) => d.pageContent);
  } catch (e) {
    throw e;
  }
}

async function getTexts(file) {
  try {
    const data = await fs.readFile(file.path);
    await fs.writeFile(`uploads/${file.originalname}`, data);
    console.log(`File uploaded: ${file.originalname}`);
    await fs.unlink(file.path);
    return await processTexts(`./uploads/${file.originalname}`);
  } catch (e) {
    throw e;
  }
}

export function makeMessage(color, name, content) {
  const message = {
    color: color,
    name: name,
    content: content,
  };
  return message;
}

export function merge(a, b) {
  // merge a and b with no dupes
  const map = new Map();
  let res = a.concat(b.filter((item) => a.indexOf(item) < 0));
  return res;
}

export function updateList(list, item) {
  list.splice(list.indexOf(item), 1);
  list.unshift(item);
}

export async function mockPromisePass() {
  const promise = new Promise((resolve, _reject) => {
    setTimeout(() => {
      resolve("mockPromise resolved in 1s");
    }, 1000);
  });
  return promise;
}

export async function mockPromiseFail() {
  const promise = new Promise((_resolve, reject) => {
    setTimeout(() => {
      reject("mockPromise resolved in 1s");
    }, 1000);
  });
  return promise;
}

const util = {
  getTexts,
  processTexts,
  makeMessage,
  merge,
  updateList,
  mockPromisePass,
  mockPromiseFail,
};

export { util };
