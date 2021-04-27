import { headers, preflightHeaders } from "./consts/headers";
import { ExtractRouteParams } from "./models/extract-route-params";
import { HttpMethod } from "./models/http-method";
import { ParameterType } from "./models/parameter-type";
import { RouteParam } from "./models/route-param";
import { RouteResponseCallback } from "./models/route-response-callback";
import { Stub } from "./models/stub";

export class CypressEasyNetworkStub {
  private readonly _stubs: Stub<any>[] = [];
  private readonly _urlMatch: string | RegExp;
  private readonly _parameterTypes: ParameterType[] = [];

  constructor(urlMatch: string | RegExp) {
    this._urlMatch = urlMatch;

    this._parameterTypes.push({
      name: "string",
      matcher: "(\\w+)",
      parser: (a) => a,
    });
    this._parameterTypes.push({
      name: "number",
      matcher: "(\\d+)",
      parser: (a) => Number.parseInt(a, 10),
    });
    this._parameterTypes.push({
      name: "boolean",
      matcher: "(true|false)",
      parser: (a) => a === "true",
    });
  }

  public init(): any {
    return cy.intercept({ url: this._urlMatch }, async (req) => {
      req.url = req.url.toLowerCase();

      if (req.method.toUpperCase() === "OPTIONS") {
        req.reply(200, undefined, preflightHeaders);
        return;
      }

      const stub = this._stubs.find(
        (x) => req.url.match(x.regx) && x.method === req.method
      );

      if (!stub) {
        console.error("Route not mocked");
        console.groupCollapsed("Mocking info");
        console.groupCollapsed("Request");
        console.log(req);
        console.groupEnd();
        console.groupCollapsed("Mocks");
        console.log(this._stubs);
        console.groupEnd();
        console.groupEnd();
        req.destroy();
        assert.fail("Route not mocked: " + req.url);
      }

      const res = req.url.match(stub.regx);

      if (!res) {
        throw new Error(
          "The provided matcher did not match the current request"
        );
      }

      const paramMap: ExtractRouteParams<any> = {};
      for (let i = 0; i < stub.params.length; i++) {
        const param = stub.params[i];
        let paramValue: any;

        const knownParameter = this._parameterTypes.find(
          (x) => x.name === param.type
        );
        if (knownParameter) {
          paramValue = knownParameter.parser(res[i + 1]);
        } else {
          paramValue = res[i + 1];
        }

        paramMap[stub.params[i].name] = paramValue;
      }
      let parsedBody: any;
      try {
        parsedBody = JSON.parse(req.body);
      } catch {
        if (req.body === "true") {
          parsedBody = true;
        } else if (req.body === "false") {
          parsedBody = false;
        } else if (/^\d+$/.test(req.body)) {
          parsedBody = Number.parseInt(req.body, 10);
        } else if (/^\d*.\d*$/.test(req.body)) {
          parsedBody = Number.parseFloat(req.body);
        } else {
          parsedBody = req.body;
        }
      }

      let response = await stub.response(parsedBody, paramMap);
      if (typeof response !== "object") {
        // Because strings or other primitive types also get parsed with JSON.parse, we need to strigify them here first
        response = JSON.stringify(response);
      }

      console.groupCollapsed("[stub]" + stub.method + " - " + stub.regx.source);
      console.groupCollapsed("request");
      console.log("url: " + req.url);
      console.groupCollapsed("headers");
      console.log(req.headers);
      console.groupEnd();
      console.groupCollapsed("body");
      console.log(req.body);
      console.groupEnd();
      console.groupCollapsed("parsedBody");
      console.log(parsedBody);
      console.groupEnd();
      console.groupEnd();
      console.groupCollapsed("response");
      console.groupCollapsed("body");
      console.log(response);
      console.groupEnd();
      console.groupCollapsed("headers");
      console.log(headers);
      console.groupEnd();
      console.groupEnd();
      console.groupEnd();

      req.reply({ body: response, headers });

      return response;
    });
  }

  public addParameterType(
    name: string,
    matcher: string,
    parser: (v: string) => any
  ) {
    this._parameterTypes.push({ name, matcher, parser });
  }

  public stub<Route extends string>(
    method: HttpMethod,
    route: Route,
    response: RouteResponseCallback<Route>
  ): void {
    const segments = route
      .toLowerCase()
      .split("/")
      .filter((x) => !!x);
    const params: RouteParam[] = [];
    const rgxString =
      segments
        .map((segment) => {
          const paramMatch = segment.match(/{(\w+)(:\w+)?}/);
          if (paramMatch) {
            const paramName = paramMatch[1];
            if (paramMatch[2]) {
              const paramType = paramMatch[2].substring(1) ?? "string";
              params.push({ name: paramName, type: paramType });
              const knownParameter = this._parameterTypes.find(
                (x) => x.name === paramType
              );
              if (knownParameter) {
                return knownParameter.matcher;
              }
            }
            return "(\\w+)";
          } else {
            return segment;
          }
        })
        .join("/") + "/?$";

    const regx = new RegExp(rgxString);

    this._stubs.push({
      regx,
      response,
      params,
      method,
    });
  }
}
