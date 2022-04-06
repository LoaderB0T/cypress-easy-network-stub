import { HttpMethod } from 'easy-network-stub';

export const getError = (url: string, method: HttpMethod): string => {
  return `Route not mocked: [${method}] ${url}`;
};
