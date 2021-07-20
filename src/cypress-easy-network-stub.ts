import { headers, preflightHeaders } from './consts/headers';
import { ExtractRouteParams } from './models/extract-route-params';
import { HttpMethod } from './models/http-method';
import { ParameterType, ParamMatcher } from './models/parameter-type';
import { QueryParams } from './models/query-params';
import { RouteParam } from './models/route-param';
import { RouteResponseCallback } from './models/route-response-callback';
import { Stub } from './models/stub';

export class CypressEasyNetworkStub {
  private readonly _stubs: Stub<any>[] = [];
  private readonly _urlMatch: string | RegExp;
  private readonly _parameterTypes: ParameterType[] = [];

  /**
   * A class to intercept and stub all calls to a certain api path.
   * @param urlMatch The match for all request urls that should be intercepted.
   * All non-stubbed calls that match this interceptor will throw an error
   */
  constructor(urlMatch: string | RegExp) {
    this._urlMatch = urlMatch;

    this.addParameterType('string', '(\\w+)');
    this.addParameterType('number', '(\\d+)', a => Number.parseInt(a, 10));
    this.addParameterType('boolean', '(true|false)', a => a === 'true');
  }

  /**
   * Call this in your beforeEach hook to start using the stub.
   * @returns The cypress chainable to chain to and to have it include itself into an existing chain.
   */
  public init(): Cypress.Chainable<null> {
    return cy.intercept({ url: this._urlMatch }, async req => {
      req.url = req.url.toLowerCase();

      if (req.method.toUpperCase() === 'OPTIONS') {
        req.reply(200, undefined, preflightHeaders);
        return;
      }

      const stub = this._stubs.find(x => req.url.match(x.regx) && x.method === req.method);

      if (!stub) {
        console.error('Route not mocked');
        console.groupCollapsed('Mocking info');
        console.groupCollapsed('Request');
        console.log(req);
        console.groupEnd();
        console.groupCollapsed('Mocks');
        console.log(this._stubs);
        console.groupEnd();
        console.groupEnd();
        req.destroy();
        assert.fail('Route not mocked: ' + req.url);
      }

      const res = req.url.match(stub.regx);

      if (!res) {
        throw new Error('The provided matcher did not match the current request');
      }

      const paramMap: ExtractRouteParams<any> = {};
      const queryParams: QueryParams = {};
      for (let i = 0; i < stub.params.length; i++) {
        const param = stub.params[i];
        let paramValue: any;

        const knownParameter = this._parameterTypes.find(x => x.name === param.type);
        if (knownParameter) {
          paramValue = knownParameter.parser(res[i + 1]);
        } else {
          paramValue = res[i + 1];
        }

        paramMap[stub.params[i].name] = paramValue;
      }

      for (let i = 0; i < stub.queryParams.length; i++) {
        const param = stub.queryParams[i];
        const paramStrVal = res[i + 1 + stub.params.length];
        let paramValue: any;
        let knownParameter = this._parameterTypes.find(x => x.name === param.type);
        if (knownParameter) {
          paramValue = knownParameter.parser(paramStrVal);
        } else {
          paramValue = paramStrVal;
        }

        queryParams[param.name] = paramValue;
      }
      let parsedBody: any;
      try {
        parsedBody = JSON.parse(req.body);
      } catch {
        if (req.body === 'true') {
          parsedBody = true;
        } else if (req.body === 'false') {
          parsedBody = false;
        } else if (/^\d+$/.test(req.body)) {
          parsedBody = Number.parseInt(req.body, 10);
        } else if (/^\d*.\d*$/.test(req.body)) {
          parsedBody = Number.parseFloat(req.body);
        } else {
          parsedBody = req.body;
        }
      }

      let response = await stub.response(parsedBody, paramMap, queryParams);
      if (typeof response !== 'object') {
        // Because strings or other primitive types also get parsed with JSON.parse, we need to strigify them here first
        response = JSON.stringify(response);
      }

      console.groupCollapsed('[stub]' + stub.method + ' - ' + stub.regx.source);
      console.groupCollapsed('request');
      console.log('url: ' + req.url);
      console.groupCollapsed('headers');
      console.log(req.headers);
      console.groupEnd();
      console.groupCollapsed('body');
      console.log(req.body);
      console.groupEnd();
      console.groupCollapsed('parsedBody');
      console.log(parsedBody);
      console.groupEnd();
      console.groupEnd();
      console.groupCollapsed('response');
      console.groupCollapsed('body');
      console.log(response);
      console.groupEnd();
      console.groupCollapsed('headers');
      console.log(headers);
      console.groupEnd();
      console.groupEnd();
      console.groupEnd();

      req.reply({ body: response, headers });

      return response;
    });
  }

  /**
   * Add a new parameter type that can be used in the stub method route property.
   * @param name The name of the new parameter (To use it as {name} later in the route property)
   * @param matcher The regex matching group that matches the parameter. Eg: "([a-z]\d+)"
   * @param parser The optional function that parses the string found by the matcher into any type you want.
   */
  public addParameterType<A>(name: string, matcher: ParamMatcher, parser: (v: string) => any = s => s) {
    this._parameterTypes.push({ name, matcher, parser });
  }

  /**
   * Add a single api stub to your intercepted routes.
   * @param method The http method that should be stubbed
   * @param route The route that should be stubbed. Supports parameters in the form of {name:type}.
   * @param response The callback in which you can process the request and reply with the stub. When a Promise is returned, the stub response will be delayed until it is resolved.
   */
  public stub<Route extends string>(method: HttpMethod, route: Route, response: RouteResponseCallback<Route>): void {
    const segments = route
      .toLowerCase()
      .split(/[/?&]/g)
      .filter(x => !!x);
    const params: RouteParam[] = [];
    const queryParams: RouteParam[] = [];
    const rgxString =
      segments
        .map(segment => {
          const paramMatch = segment.match(/{(\w+)(:\w+)?}/);
          const queryParamMatch = segment.match(/^(\w+)=(\w+)$/);
          if (paramMatch) {
            const paramName = paramMatch[1];
            if (paramMatch[2]) {
              const paramType = paramMatch[2].substring(1) ?? 'string';
              params.push({ name: paramName, type: paramType });
              const knownParameter = this._parameterTypes.find(x => x.name === paramType);
              if (knownParameter) {
                return knownParameter.matcher;
              }
            }
            return '(\\w+)';
          } else if (queryParamMatch) {
            const queryParamName = queryParamMatch[1];
            const queryParamType = queryParamMatch[2] ?? 'string';
            queryParams.push({ name: queryParamName, type: queryParamType });
            return '\\w+=(\\w+)';
          } else {
            return segment;
          }
        })
        .join('/') + '/?$';

    const regx = new RegExp(rgxString);

    this._stubs.push({
      regx,
      response,
      params,
      queryParams,
      method
    });
  }
}
