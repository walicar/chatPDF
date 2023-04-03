import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { PDFLoader } from 'langchain/document_loaders';
import { PineconeStore } from 'langchain/vectorstores';
import { PineconeClient } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';
dotenv.config();

let textsConfig = {chunkSize: 100, chunkOverlap: 25};

export async function getTexts(path) {
  const loader = new PDFLoader(path);
  const doc = await loader.load();
  const splitter = new RecursiveCharacterTextSplitter(textsConfig);
  const docs = await splitter.splitDocuments(doc);
  return docs.map(d => d.pageContent);
}

export async function createEmbeddings(texts, indexName) {
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
  return vectorStore
}

