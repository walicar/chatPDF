import * as dotenv from "dotenv";
dotenv.config();
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { PDFLoader } from "langchain/document_loaders";
import { PineconeStore } from "langchain/vectorstores";
import { PineconeClient } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings } from "langchain/embeddings";
import { OpenAI } from "langchain";
import { loadQAStuffChain } from "langchain/chains";

// pinecone dimensions 1536

export async function getTexts(path) {
  console.log(path);
  console.log(typeof path);
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
  try {
    const vectorStore = await PineconeStore.fromTexts(
      texts,
      metadatas,
      embeddings,
      dbConfig,
    );
    return vectorStore;
  } catch (e) {
    console.log(e);
  }
}

export async function queryDoc(query, vectorStore) {
  console.log("inside querydoc");
  try {
    const docs = await vectorStore.similaritySearch(query);
    const llm = new OpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      temperature: 0.5,
    });
    const chain = loadQAStuffChain(llm);
    const answer = await chain.call({ input_documents: docs, question: query });
    console.log(answer);
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

export async function getPineconeStore(indexName) {
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
    dbConfig,
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
    dimension: 1535,
    metric: "cosine",
    podType: "p1",
  };
  await client.createIndex({ createRequest });
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
  const promise = new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve("mockPromise resolved in 1s");
    }, 1000);
  });
  return promise;
}

export async function mockPromiseFail() {
  const promise = new Promise((resolve, reject) => {
    setTimeout(() => {
      reject("mockPromise resolved in 1s");
    }, 1000);
  });
  return promise;
}
