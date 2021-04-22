var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const httpMethods = ["GET", "POST", "PUT", "DELETE", "PATCH"];
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
    constructor(urlMatch) {
        this._stubs = [];
        this._parameterTypes = [];
        this._urlMatch = urlMatch;
        this._parameterTypes.push({ name: "number", matcher: "(\\d+)" });
        this._parameterTypes.push({ name: "boolean", matcher: "(true|false)" });
    }
    init() {
        return cy.intercept({ url: this._urlMatch }, (req) => __awaiter(this, void 0, void 0, function* () {
            req.url = req.url.toLowerCase();
            if (req.method.toUpperCase() === "OPTIONS") {
                req.reply(200, undefined, preflightHeaders);
                return;
            }
            if (httpMethods.indexOf(req.method) === -1) {
                req.destroy();
                return;
            }
            const stub = this._stubs.find((x) => req.url.match(x.regx) && x.method === req.method);
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
            const paramMap = {};
            for (let i = 0; i < stub.params.length; i++) {
                const param = stub.params[i];
                let paramValue;
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
            let parsedBody;
            try {
                parsedBody = JSON.parse(req.body);
            }
            catch (_a) {
                if (req.body === "true") {
                    parsedBody = true;
                }
                else if (req.body === "false") {
                    parsedBody = false;
                }
                else if (/^\d+$/.test(req.body)) {
                    parsedBody = Number.parseInt(req.body, 10);
                }
                else if (/^\d*.\d*$/.test(req.body)) {
                    parsedBody = Number.parseFloat(req.body);
                }
                else {
                    parsedBody = req.body;
                }
            }
            let response = yield stub.response(parsedBody, paramMap);
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
        }));
    }
    addParameterType(name, matcher) {
        this._parameterTypes.push({ name, matcher });
    }
    stub(method, path, response) {
        const segments = path
            .toLowerCase()
            .split("/")
            .filter((x) => !!x);
        const params = [];
        const rgxString = segments
            .map((segment) => {
            var _a;
            const paramMatch = segment.match(/{(\w+)(:\w+)?}/);
            if (paramMatch) {
                const paramName = paramMatch[1];
                if (paramMatch[2]) {
                    const paramType = (_a = paramMatch[2].substring(1)) !== null && _a !== void 0 ? _a : "string";
                    params.push({ name: paramName, type: paramType });
                    const knownParameterMatcher = this._parameterTypes.find((x) => x.name === paramType);
                    if (knownParameterMatcher) {
                        return knownParameterMatcher.matcher;
                    }
                }
                return "(\\w+)";
            }
            else {
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
