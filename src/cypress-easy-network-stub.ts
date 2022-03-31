import { EasyNetworkStub, HttpMethod } from 'easy-network-stub';

export class CypressEasyNetworkStub extends EasyNetworkStub {
  /**
   * A class to intercept and stub all calls to a certain api path.
   * @param urlMatch The match for all request urls that should be intercepted.
   * All non-stubbed calls that match this interceptor will throw an error
   */
  constructor(urlMatch: string | RegExp) {
    super(urlMatch);
  }

  /**
   * Call this in your beforeEach hook to start using the stub.
   * @returns The cypress chainable to chain to and to have it include itself into an existing chain.
   */
  public init(): Cypress.Chainable<null> {
    return this.initInternal({
      failer: error => assert.fail(error instanceof Error ? error.message : error),
      interceptor: (baseUrl, handler) => {
        return cy.intercept({ url: baseUrl }, async req => {
          await handler({
            url: req.url,
            method: req.method as HttpMethod,
            headers: req.headers,
            destroy: () => req.destroy(),
            reply: reply => req.reply(reply),
            body: req.body
          });
        });
      }
    });
  }
}
