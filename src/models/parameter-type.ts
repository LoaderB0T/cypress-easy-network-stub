export type ParameterType = {
  name: string;
  matcher: string;
  parser: (v: string) => any;
};
