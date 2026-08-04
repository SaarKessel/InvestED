import { askOllama } from "./ollamaClient";


async function test(){

 const answer = await askOllama(
   "Explain S&P 500 investing in one sentence"
 );

 console.log(answer);

}


test();