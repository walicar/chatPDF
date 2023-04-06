import * as dotenv from 'dotenv';
dotenv.config();
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { PDFLoader } from 'langchain/document_loaders';
import { PineconeStore } from 'langchain/vectorstores';
import { PineconeClient } from "@pinecone-database/pinecone";

export async function getTexts(path) {
  console.log(path);
  console.log(typeof path);
  const loader = new PDFLoader(path);
  const doc = await loader.load();
  const splitter = new RecursiveCharacterTextSplitter({chunkSize: 1000, chunkOverlap: 20});
  const docs = await splitter.splitDocuments(doc);
  return docs.map(d => d.pageContent);
}

export async function createEmbeddings(texts, indexName) {
  // use indexName for custom things
  const fields = {openAIApiKey: process.env.OPENAI_API_KEY};
  const embeddings = new OpenAIEmbeddings(fields);
  const pineconeClient = new PineconeClient();
  await pineconeClient.init({
    apiKey: process.env.OPENAI_API_KEY,
    environment: process.env.PINECONE_API_ENV
  });
  const index = pineconeClient.Index('cpdf1');
  const metadatas = [{}];
  const dbConfig = {pineconeIndex: index};
  let vectorStore;
  try {
    vectorStore = await PineconeStore.fromTexts(texts, metadatas, embeddings, dbConfig);
  } catch (e) {
    console.log(e);
  }
  return vectorStore;
}

export async function mockPromisePass() {
  const promise = new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve('mockPromise resolved in 1s');
    }, 1000)
  });
  return promise;
}
export async function mockPromiseFail() {
  const promise = new Promise((resolve, reject) => {
    setTimeout(() => {
      reject('mockPromise resolved in 1s');
    }, 1000)
  });
  return promise;
}
