import * as dotenv from "dotenv";
dotenv.config();
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { PineconeClient } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { OpenAI } from "langchain/llms/openai";
import { loadQAStuffChain } from "langchain/chains";

// pinecone dimensions 1536

export class PineconeHelper {
  constructor() {
    this.store;
  }

  async init() {
    const client = new PineconeClient();
    try {
      await client.init({
        apiKey: process.env.PINECONE_API_KEY,
        environment: process.env.PINECONE_API_ENV,
      });
    } catch (e) {
      throw e;
    }
    return client;
  }

  async createEmbeddings(texts, name) {
    const fields = { openAIApiKey: process.env.OPENAI_API_KEY };
    const embeddings = new OpenAIEmbeddings(fields);
    const client = await this.init();
    const index = client.Index(name);
    const metadatas = [{}];
    const dbConfig = { pineconeIndex: index };
    try {
      const store = await PineconeStore.fromTexts(
        texts,
        metadatas,
        embeddings,
        dbConfig
      );
      this.store = store;
    } catch (e) {
      console.log(e);
    }
  }

  async queryDoc(query) {
    try {
      const docs = await this.store.similaritySearch(query);
      const llm = new OpenAI({
        openAIApiKey: process.env.OPENAI_API_KEY,
        temperature: 0.5,
      });
      const chain = loadQAStuffChain(llm);
      const answer = await chain.call({ input_documents: docs, question: query });
      return answer.text;
    } catch (e) {
      console.log(e);
    }
  }

  async createIndex() {
    const client = await this.init();
    const createRequest = {
      name: indexName,
      dimension: 1536,
      metric: "cosine",
      podType: "p1",
    };
    try {
      await client.createIndex({ createRequest });
    } catch (e) {
      throw e;
    }
  }

  async getIndices() {
    const client = await this.init();
    try {
      const list = await client.listIndexes();
      return list;
    } catch (e) {
      return e;
    }
  }

  async getIndex(name) {
    const fields = { openaiapikey: process.env.openai_api_key };
    const embeddings = new OpenAIEmbeddings(fields);
    const client = await this.init();
    const index = client.Index(name);
    const dbconfig = { pineconeIndex: index };
    try {
      const store = await PineconeStore.fromexistingindex(
        embeddings,
        dbconfig
      );
      return store;
    } catch (e) {
      return e;
    }
  }

  async describeIndex(name) {
    const client = await this.init();
    try {
      const result = await client.describeIndex({ indexName: name });
      return result;
    } catch (e) {
      return e;
    }
  }

  async deleteIndex(name) {
    const client = await this.init();
    await client.deleteIndex(name);
  }

  async poll(name) {
    // not tested
    const interval = 5000
    let desc;
    let flag = false;
    const client = await this.init();
    setInterval(async () => {
      try {
        desc = await client.describeIndex({ indexName: name });
      } catch (e) {
        return e;
      }
      if (desc.status.ready) {
        flag = true;
        clearInterval(this);
      }
    }, interval)
    return flag;
  }
}
