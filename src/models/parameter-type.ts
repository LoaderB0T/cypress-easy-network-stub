export type ParamMatcher = `(${string})`;

export type ParameterType = {
  name: string;
  matcher: ParamMatcher;
  parser: (v: string) => any;
};
