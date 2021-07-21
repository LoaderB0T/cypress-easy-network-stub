import { CypressEasyNetworkStub } from '../src/cypress-easy-network-stub';
const blogStub = new CypressEasyNetworkStub('/MyServer/api/Blog');

blogStub.stub('DELETE', 'posts/{id:number}/{id2}/{id3:number}', (body, params) => {});
