import axios, { AxiosPromise } from 'axios'
import { print } from 'graphql/language/printer';
import { Client, ExecutionResult, createClient } from 'graphql-ws';

export default class GraphqlClient {
  private url: string
  private headers: Record<string, string>;
  private subscriptionClient: Client;

  constructor(url: string, headers: Record<string, string>) {
    if (!url) {
      throw new Error('[graphql-friendly] - options.url is required');
    }

    this.url = url;
    this.headers = headers ?? {};

    // NOTE: automatically replace http by ws and https by wss for the subscription query
    let wsUrl = url.replace(/http:\/\//, 'ws://').replace(/https:\/\//, 'wss://')

    this.subscriptionClient = createClient({
      url: wsUrl,
    });
  }

  async query(args, { headers } = { headers: undefined }): AxiosPromise<any> {
    // Merge current headers (specific to this query) with global headers (provided by the constructor function)
    const currentHeaders = {
      ...this.headers,
      ...headers
    };

    if (Array.isArray(args)) {
      let finalQuery = '';
      for (let i = 0; i < args.length; i++) {
        if (!args[i].query) {
          throw new Error(`Query at index ${i} is incorrect`);
        }

        if (i === 0) {
          finalQuery += print(args[i].query).slice(0, -3);
        } else {
          finalQuery += print(args[i].query).slice(1);
        }
      }

      return axios({
        url: this.url,
        method: 'POST',
        data: { query: finalQuery },
        headers: currentHeaders
      })
        .then(({ data }) => data);
    }

    const { query, variables } = args;

    let queryString = query;
    if (typeof query === 'object' && query.kind === 'Document') {
      queryString = print(query)
    }

    return axios({
      url: this.url,
      method: 'POST',
      data: { query: queryString, variables },
      headers: currentHeaders
    })
      .then(({ data }) => data);
  }

  mutation({ query, variables }, opts): AxiosPromise<any> {
    return this.query({ query, variables }, opts);
  }

  subscribe({ query, variables }): AsyncIterableIterator<ExecutionResult<Record<string, unknown>, unknown>> {
    let queryString = query;

    if (typeof query === 'object' && query.kind === 'Document') {
      queryString = print(query);
    }

    return this.subscriptionClient.iterate({ query, variables })
  }
}
