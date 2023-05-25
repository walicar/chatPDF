import { messageType } from "./messageType"
export type stateType = {
  error: string,
  response: string,
  index: string,
  indices: string[],
  vectorStore: any | undefined,
  messages: messageType[]
}
