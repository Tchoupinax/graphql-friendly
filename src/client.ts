
import axios, { AxiosPromise } from 'axios'
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
    this.headers = headers ?? {};

    // NOTE: automatically replace http by ws and https by wss for the subscription query
    let wsUrl = url.replace(/http:\/\//, 'ws://').replace(/https:\/\//, 'wss://')

    try {
      if (window) {
        // Lazy load this part if the client supports it
        import('graphql-subscriptions-client').then(({ SubscriptionClient }) => {
          this.subscriptionClient = new SubscriptionClient(wsUrl, {
            reconnect: true,
            lazy: true, // only connect when there is a query
            connectionCallback: error => {
              error && console.error(error)
            }
          });
        })
      }
    } catch (err) {
      this.subscriptionClient = null
    }
  }

  query(args, { headers } = { headers: undefined }): AxiosPromise<any> {
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

  subscribe({ query, variables }) {
    let queryString = query;

    if (typeof query === 'object' && query.kind === 'Document') {
      queryString = print(query);
    }

    if (this.subscriptionClient?.request) {
      return this.subscriptionClient.request({ query: queryString, variables });
    } else {
      return new Promise((r) => {
        setTimeout(() => {
          r(this.subscribe({ query, variables }));
        }, 200);
      })
    }
  }
}