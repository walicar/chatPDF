import { getTexts } from '../util.js'
import dotenv from 'dotenv';
dotenv.config();

describe('getTexts returns texts object', () => {
  it('gives length of input pdf file', async () => {
    const texts = await getTexts("./spec/descartes.pdf")
    spyOn(console, 'log').and.callThrough();
    expect(texts.length).toEqual(9929);
  })
})

// TODO: remove me
describe('we can get .env var', () => {
  it('we get TEST_API_KEY', () => {
    console.log(process.env.TEST_API_KEY);
    expect(process.env.TEST_API_KEY).toEqual('testphrase123');
  })
})
