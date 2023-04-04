import { getTexts } from '../util.js'
import dotenv from 'dotenv';
dotenv.config();

describe('getTexts returns texts object', () => {
  it('gives length of input pdf file', async () => {
    const texts = await getTexts("./spec/descartes.pdf")
    spyOn(console, 'log').and.callThrough();
    expect(texts.length).toEqual(1196);
  })
})

// TODO: remove me
describe('we can get .env var', () => {
  it('we get TEST_API_KEY', () => {
    console.log(process.env.TEST_API_KEY);
    console.log(process.cwd());
    expect(process.env.TEST_API_KEY).toEqual('testphrase123');
  })
})

/*
describe('We can createEmbeddings', () => {
  // we want to find out how we can get a resposne code instead of just
  // manually testing it
  it('succesfuly creates embeddings in pineconestore', () => {
    // this might time out?
  })
})
*/
