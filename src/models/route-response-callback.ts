import { ExtractRouteParams } from './extract-route-params';
import { QueryParams } from './query-params';

export type RouteResponseCallback<T extends string> = (
  body: any,
  routeParams: ExtractRouteParams<T>,
  queryParams: QueryParams
) => any | Promise<any>;
