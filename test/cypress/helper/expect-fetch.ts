import { HttpMethod } from 'easy-network-stub';
import { getError } from './expected-error';

export type FetchType = {
  url: string;
  method?: HttpMethod;
  body?: any;
};

export const expectFetch = (cfg: FetchType, expectedData: any) => {
  return cy.wrap(null).then(() => {
    return doFetch(cfg).then(fetchedData => {
      expect(fetchedData).to.deep.equal(expectedData);
    });
  });
};

export const doFetch = async (cfg: FetchType) => {
  return new Promise((resolve, reject) => {
    window
      .fetch(cfg.url, { method: cfg.method ?? 'GET', body: cfg.body })
      .then(res => {
        res
          .json()
          .then(data => {
            resolve(data);
          })
          .catch(err => {
            reject(err);
          });
      })
      .catch(err => {
        reject(err);
      });
  });
};

export const expectFailFetch = (baseUrl: string, url: string, method: HttpMethod, getLastError: () => string) => {
  return cy.wrap(null).then(() => {
    return doFetch({ url, method })
      .catch(() => {
        // expected, but ignored, because we want to assert the error
      })
      .then(() => {
        cy.wrap(getLastError()).should('equal', getError(baseUrl + url, method));
      });
  });
};
