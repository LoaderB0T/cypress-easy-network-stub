import { CypressEasyNetworkStub } from "../src/cypress-easy-network-stub";

export class Test {
  init() {
    const a = new CypressEasyNetworkStub("/test");
    a.init();
    a.stub(
      "POST",
      "test/test/{a:string}/{test:number}/test/{b:boolean}/fml/{yee}",
      (body, params) => {
        console.log(params.a);
      }
    );
  }
}
