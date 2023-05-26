import * as dotenv from "dotenv";
dotenv.config();
import { Chroma } from "langchain/vectorstores/chroma";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { ChromaClient, OpenAIEmbeddingFunction } from "chromadb";
import { OpenAI } from "langchain/llms/openai";
import { loadQAStuffChain } from "langchain/chains";
export class ChromaHelper {
  constructor() {
    this.client = new ChromaClient();
  }

  async createEmbeddings(texts, name) {
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
    const metadatas = [{}];
    try {
      const embedder = new OpenAIEmbeddingFunction({
        openai_api_key: process.env.OPENAI_API_KEY,
      });
      await this.client.createCollection({ name, embeddingFunction: embedder });
      const store = await Chroma.fromTexts(texts, metadatas, embeddings, {
        collectionName: name,
      });
      this.store = store;
      return store;
    } catch (e) {
      return e;
    }
  }

  async deleteCollection(name) {
    try {
      const res = await this.client.deleteCollection({ name });
      return res;
    } catch (e) {
      return e;
    }
  }

  async queryDoc(query) {
    if (this.store) {
      try {
        const docs = await this.store.similaritySearch(query, 1);
        const llm = new OpenAI({
          openAIApiKey: process.env.OPENAI_API_KEY,
          temperature: 0.3,
        });
        const chain = loadQAStuffChain(llm);
        const answer = await chain.call({
          input_documents: docs,
          question: query,
        });
        return answer.text;
      } catch (e) {
        return e;
      }
    } else {
      return Error("Store does not exist");
    }
  }

  async getcollections() {
    try {
      const res = await this.client.listCollections()
      return res;
    } catch (e) {
      return e;
    }
  }
}
