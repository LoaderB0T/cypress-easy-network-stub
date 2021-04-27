export type FlattenUnion<T> = {} extends T
  ? never
  : {
      [K in keyof T]: K extends keyof T
        ? T[K] extends any[]
          ? T[K]
          : T[K] extends object
          ? FlattenUnion<T[K]>
          : T[K]
        : T[K];
    };

export type ExtractRouteParams<T extends string> = string extends T
  ? Record<string, string>
  : T extends `${infer Start}{${infer Param}:${infer ParamType}}/${infer Rest}`
  ? FlattenUnion<
      { [k in Param]: TypeConverter<ParamType> } & ExtractRouteParams<Rest>
    >
  : T extends `${infer Start}{${infer Param}:${infer ParamType}}`
  ? { [k in Param]: TypeConverter<ParamType> }
  : T extends `${infer Start}{${infer Param}}/${infer Rest}`
  ? { [k in Param | keyof ExtractRouteParams<Rest>]: string }
  : T extends `${infer Start}{${infer Param}}`
  ? { [k in Param]: string }
  : {};

export type TypeConverter<T extends string> = T extends "number"
  ? number
  : T extends "boolean"
  ? boolean
  : string;
