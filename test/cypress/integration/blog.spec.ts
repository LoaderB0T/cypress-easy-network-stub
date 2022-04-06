import { CypressEasyNetworkStub } from '../../../src/index';
import { expectFailFetch, expectFetch } from '../helper/expect-fetch';

let blogStub: CypressEasyNetworkStub;
let lastError: string;
const baseUrl = 'https://example.com';

describe('CypressEasyNetworkStub', () => {
  beforeEach(() => {
    blogStub = new CypressEasyNetworkStub('**/MyServer/api/Blog/**');
    blogStub.init();
    blogStub['config'].failer = (error: string) => {
      lastError = error;
    };
    blogStub['config'].errorLogger = () => {
      // Do nothing
    };
    cy.visit(baseUrl);
  });

  it('Mock with static url', () => {
    blogStub.stub('GET', 'posts', () => {
      return [
        { id: 1, title: 'Hello' },
        { id: 2, title: 'World' }
      ];
    });

    expectFetch({ url: '/MyServer/api/Blog/posts' }, [
      { id: 1, title: 'Hello' },
      { id: 2, title: 'World' }
    ]);
    // Trailing slash is matched as well
    expectFetch({ url: '/MyServer/api/Blog/posts/' }, [
      { id: 1, title: 'Hello' },
      { id: 2, title: 'World' }
    ]);
  });

  it('Get error for not mocked paths', () => {
    blogStub.stub('GET', 'posts', () => {
      return [
        { id: 1, title: 'Hello' },
        { id: 2, title: 'World' }
      ];
    });
    expectFailFetch(baseUrl, '/MyServer/api/Blog/posts2', 'GET', () => lastError);
    expectFailFetch(baseUrl, '/MyServer/api/Blog/post', 'GET', () => lastError);
    expectFailFetch(baseUrl, '/MyServer/api/Blog/posts/my', 'GET', () => lastError);
    expectFailFetch(baseUrl, '/MyServer/api/Blog/', 'GET', () => lastError);
  });

  it('Get error for not mocked methods', () => {
    blogStub.stub('GET', 'posts', () => {
      return [
        { id: 1, title: 'Hello' },
        { id: 2, title: 'World' }
      ];
    });
    expectFailFetch(baseUrl, '/MyServer/api/Blog/posts', 'POST', () => lastError);
    expectFailFetch(baseUrl, '/MyServer/api/Blog/posts', 'DELETE', () => lastError);
    expectFailFetch(baseUrl, '/MyServer/api/Blog/posts', 'PUT', () => lastError);
    expectFailFetch(baseUrl, '/MyServer/api/Blog/posts', 'PATCH', () => lastError);
  });

  it('Mock with typed parameters', () => {
    blogStub.stub('GET', 'posts1/{id}', ({ params }) => {
      return { id: params.id, title: 'Hello' };
    });
    expectFetch({ url: '/MyServer/api/Blog/posts1/1' }, { id: '1', title: 'Hello' });
    expectFetch({ url: '/MyServer/api/Blog/posts1/2' }, { id: '2', title: 'Hello' });

    blogStub.stub('GET', 'posts2/{id:number}', ({ params }) => {
      return { id: params.id, title: 'Hello' };
    });
    expectFetch({ url: '/MyServer/api/Blog/posts2/1' }, { id: 1, title: 'Hello' });
    expectFetch({ url: '/MyServer/api/Blog/posts2/2' }, { id: 2, title: 'Hello' });

    blogStub.stub('GET', 'posts3/{read:boolean}', ({ params }) => {
      return [
        { id: 1, title: 'Hello', read: true },
        { id: 2, title: 'World', read: false },
        { id: 3, title: 'Hello2', read: true },
        { id: 4, title: 'World2', read: false }
      ].filter(x => x.read === params.read);
    });
    expectFetch({ url: '/MyServer/api/Blog/posts3/true' }, [
      { id: 1, title: 'Hello', read: true },
      { id: 3, title: 'Hello2', read: true }
    ]);
    expectFetch({ url: '/MyServer/api/Blog/posts3/false' }, [
      { id: 2, title: 'World', read: false },
      { id: 4, title: 'World2', read: false }
    ]);
  });

  it('Non-object return value', () => {
    blogStub.stub('GET', 'posts1/bool', () => {
      return true;
    });
    blogStub.stub('GET', 'posts1/number', () => {
      return 12;
    });
    blogStub.stub('GET', 'posts1/string', () => {
      return 'test string';
    });

    expectFetch({ url: '/MyServer/api/Blog/posts1/bool' }, true);
    expectFetch({ url: '/MyServer/api/Blog/posts1/number' }, 12);
    expectFetch({ url: '/MyServer/api/Blog/posts1/string' }, 'test string');
  });
});
