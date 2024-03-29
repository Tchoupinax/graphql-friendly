// Vue 2 : https://vuejs.org/v2/guide/plugins.html
// Vue 3 : https://v3.vuejs.org/guide/plugins.html#writing-a-plugin

import client from './client';

export interface IOptions {
  url: string
  headers: any
}

export default {
  install: (app: any, options: IOptions) => {
    app.config.globalProperties.$graphqlClient = new client(options.url, options.headers);
    app.provide('$graphqlClient', options);
  },
};
export const GraphqlClient = client;
