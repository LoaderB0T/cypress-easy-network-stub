const httpMethods = ["GET", "POST", "PUT", "DELETE", "PATCH"];

type HTTP_METHODS = typeof httpMethods[number];

interface IRouteParams {
  [param: string]: any;
}

type ResponseIntercepter = (
  body: any,
  routeParams: IRouteParams
) => any | Promise<any>;

type RouteParam = { name: string; type: string };

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Expose-Headers": "*",
  "Content-Type": "application/json",
};
const preflightHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Expose-Headers": "*",
  "access-control-allow-headers": "*",
  "Access-Control-Request-Headers": "*",
  "Access-Control-Request-Method": "*",
  "Access-Control-Allow-Methods": "*",
};

export class CypressEasyNetworkStub {
  private readonly _stubs: {
    regx: RegExp;
    response: ResponseIntercepter;
    params: RouteParam[];
    method: HTTP_METHODS;
  }[] = [];
  private readonly _urlMatch: string | RegExp;
  private readonly _parameterTypes: { name: string; matcher: string }[] = [];

  constructor(urlMatch: string | RegExp) {
    this._urlMatch = urlMatch;

    this._parameterTypes.push({ name: "number", matcher: "(\\d+)" });
    this._parameterTypes.push({ name: "boolean", matcher: "(true|false)" });
  }

  public init(): any {
    return cy.intercept({ url: this._urlMatch }, async (req) => {
      req.url = req.url.toLowerCase();

      if (req.method.toUpperCase() === "OPTIONS") {
        req.reply(200, undefined, preflightHeaders);
        return;
      }

      if (httpMethods.indexOf(req.method) === -1) {
        req.destroy();
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

      const paramMap: IRouteParams = {};
      for (let i = 0; i < stub.params.length; i++) {
        const param = stub.params[i];
        let paramValue: any;
        switch (param.type) {
          case "number": {
            paramValue = Number.parseInt(res[i + 1], 10);
            break;
          }
          case "string":
          default: {
            paramValue = res[i + 1];
            break;
          }
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

  public addParameterType(name: string, matcher: string) {
    this._parameterTypes.push({ name, matcher });
  }

  public stub(
    method: HTTP_METHODS,
    path: string,
    response: ResponseIntercepter
  ): void {
    const segments = path
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
              const knownParameterMatcher = this._parameterTypes.find(
                (x) => x.name === paramType
              );
              if (knownParameterMatcher) {
                return knownParameterMatcher.matcher;
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
