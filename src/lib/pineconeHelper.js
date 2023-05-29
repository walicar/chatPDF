import * as dotenv from "dotenv";
dotenv.config();
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { PineconeClient } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { OpenAI } from "langchain/llms/openai";
import { loadQAStuffChain } from "langchain/chains";
import { Helper } from "./helper";

// pinecone dimensions 1536

export class PineconeHelper extends Helper {
  constructor() { super(); }

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

  async createDocument(texts, name) {
    try {
      const desc = await this.describeIndex(name);
      if (desc instanceof Error) {
        await this.createIndex(name);
        let ready = false;
        while (!ready) {
          ready = await this.poll(name);
        }
        await this.createEmbeddings(texts, name);
      } else {
        const store = await this.useDocument(name);
        return store;
      }
    } catch (e) {
      throw e;
    }
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
      return store;
    } catch (e) {
      console.log(e);
    }
  }

  async queryDocument(query) {
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

  async createIndex(name) {
    const client = await this.init();
    const createRequest = {
      name,
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

  async getDocuments() {
    const client = await this.init();
    try {
      const list = await client.listIndexes();
      return list;
    } catch (e) {
      return e;
    }
  }

  async useDocument(name) {
    const fields = { openaiapikey: process.env.openai_api_key };
    const embeddings = new OpenAIEmbeddings(fields);
    const client = await this.init();
    const index = client.Index(name);
    const dbconfig = { pineconeIndex: index };
    try {
      const store = await PineconeStore.fromExistingIndex(
        embeddings,
        dbconfig
      );
      this.store = store;
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

  async deleteDocument(name) {
    const client = await this.init();
    try {
      await client.deleteIndex(name);
    } catch (e) {
      return error;
    }
  }

  async poll(name) {
    const time = 5000
    let desc;
    let flag = false;
    const client = await this.init();
    const interval = setInterval(async () => {
      try {
        desc = await client.describeIndex({ indexName: name });
      } catch (e) {
        return e;
      }
      if (desc.status.ready) {
        flag = true;
        clearInterval(interval);
      }
    }, time)
    return flag;
  }
}
