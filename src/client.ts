
import axios, { AxiosPromise } from 'axios'
import { SubscriptionClient } from 'graphql-subscriptions-client';
import { print } from 'graphql/language/printer';

export default class GraphqlClient {
  private url: string
  private headers: any;
  private subscriptionClient: any;

  constructor(url: string, headers: any) {
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

  query({ query, variables }): AxiosPromise<any>  {
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