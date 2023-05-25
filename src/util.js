import * as dotenv from "dotenv";
dotenv.config();
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { PineconeClient } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { OpenAI } from "langchain/llms/openai";
import { loadQAStuffChain } from "langchain/chains";

// pinecone dimensions 1536

export async function getTexts(path) {
  const loader = new PDFLoader(path);
  const doc = await loader.load();
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 20,
  });
  const docs = await splitter.splitDocuments(doc);
  return docs.map((d) => d.pageContent);
}

export async function createEmbeddings(texts, indexName) {
  // use indexName for custom things
  const fields = { openAIApiKey: process.env.OPENAI_API_KEY };
  const embeddings = new OpenAIEmbeddings(fields);
  const pineconeClient = new PineconeClient();
  await pineconeClient.init({
    apiKey: process.env.PINECONE_API_KEY,
    environment: process.env.PINECONE_API_ENV,
  });
  const index = pineconeClient.Index(indexName);
  const metadatas = [{}];
  const dbConfig = { pineconeIndex: index };
  // need to wait if index is currently initializing
  try {
    const vectorStore = await PineconeStore.fromTexts(
      texts,
      metadatas,
      embeddings,
      dbConfig
    );
    return vectorStore;
  } catch (e) {
    console.log(e);
  }
}

export async function queryDoc(query, vectorStore) {
  try {
    const docs = await vectorStore.similaritySearch(query);
    const llm = new OpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      temperature: 0.5,
    });
    const chain = loadQAStuffChain(llm);
    const answer = await chain.call({ input_documents: docs, question: query });
    // might need to return {answer }k
    return answer.text;
  } catch (e) {
    console.log(e);
  }
}

export async function getIndices() {
  const pineconeClient = new PineconeClient();
  try {
    await pineconeClient.init({
      apiKey: process.env.PINECONE_API_KEY,
      environment: process.env.PINECONE_API_ENV,
    });
    const list = await pineconeClient.listIndexes();
    return list;
  } catch (e) {
    console.log(e);
  }
}

export async function getStore(indexName) {
  const fields = { openAIApiKey: process.env.OPENAI_API_KEY };
  const embeddings = new OpenAIEmbeddings(fields);
  const pineconeClient = new PineconeClient();
  try {
    await pineconeClient.init({
      apiKey: process.env.PINECONE_API_KEY,
      environment: process.env.PINECONE_API_ENV,
    });
  } catch (e) {
    console.log(e);
  }
  const index = pineconeClient.Index(indexName);
  const dbConfig = { pineconeIndex: index };
  const pineconeStore = await PineconeStore.fromExistingIndex(
    embeddings,
    dbConfig
  );
  return pineconeStore;
}

export async function createIndex(indexName) {
  const pineconeClient = new PineconeClient();
  try {
    await pineconeClient.init({
      apiKey: process.env.PINECONE_API_KEY,
      environment: process.env.PINECONE_API_ENV,
    });
  } catch (e) {
    console.log(e);
  }
  const createRequest = {
    name: indexName,
    dimension: 1536,
    metric: "cosine",
    podType: "p1",
  };
  await pineconeClient.createIndex({ createRequest });
}

export async function deleteIndex(indexName) {
  const pineconeClient = new PineconeClient();
  try {
    await pineconeClient.init({
      apiKey: process.env.PINECONE_API_KEY,
      environment: process.env.PINECONE_API_ENV,
    });
  } catch (e) {
    console.log(e);
  }
  await pineconeClient.deleteIndex({ indexName });
}

export async function checkIndex(indexName) {
  const pineconeClient = new PineconeClient();
  try {
    await pineconeClient.init({
      apiKey: process.env.PINECONE_API_KEY,
      environment: process.env.PINECONE_API_ENV,
    });
  } catch (e) {
    console.log(e);
  }
  const result = await pineconeClient.describeIndex(indexName);
  return result;
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

export function makeMessage(color, name, content) {
  const message = {
    color: color,
    name: name,
    content: content,
  };
  return message;
}

const util = {
  queryDoc,
  getTexts,
  getStore,
  getIndices,
  createIndex,
  checkIndex,
  createEmbeddings,
  deleteIndex,
  makeMessage,
  mockPromisePass,
  mockPromiseFail,
};

export { util };
