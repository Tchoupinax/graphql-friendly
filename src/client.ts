import axios, { AxiosPromise } from 'axios'
import { SubscriptionClient } from 'graphql-subscriptions-client';
import { print } from 'graphql/language/printer';

export default class GraphqlClient {
  private url: string
  private headers: Record<string, string>;
  private subscriptionClient: any;

  constructor(url: string, headers: Record<string, string>) {
    if (!url) {
      throw new Error('[graphql-friendly] - options.url is required');
    }

    this.url = url;
    this.headers = headers;

    // NOTE: automatically replace http by ws and https by wss for the subscription query
    let wsUrl = url.replace(/http:\/\//, 'ws://').replace(/https:\/\//, 'wss://')

    this.subscriptionClient = new SubscriptionClient(wsUrl, {
      reconnect: true,
      lazy: true, // only connect when there is a query
      connectionCallback: error => {
        error && console.error(error)
      }
    });
  }

  async query(args): AxiosPromise<any>  {
    if (Array.isArray(args)) {
      let finalQuery = '';
      for (let i = 0; i < args.length; i++) {
        if (!args[i].query) {
          throw new Error(`Query at index ${i} is incorrect`);
        }

        if (i === 0) {
          finalQuery += print(args[i].query).slice(0, -3);
        } else {
          finalQuery +=  print(args[i].query).slice(1);
        }
      }

      return axios({
        url: this.url,
        method: 'POST',
        data: { query: finalQuery },
        headers: this.headers
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
      headers: this.headers
    })
      .then(({ data }) => data);
  }

  mutation({ query, variables }): AxiosPromise<any>  {
    return this.query({ query, variables });
  }

  subscribe({ query, variables }) {
    let queryString = query;

    if (typeof query === 'object' && query.kind === 'Document') {
      queryString = print(query);
    }

    return this.subscriptionClient.request({ query: queryString, variables });
  }
}
