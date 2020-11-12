# graphql-friendly

**graphql-friendly** is an easy and friendly alternative to `apollo-client`.

## Motivations

I have never found another graph client that `apollo-client`. Graphql queries can be performed with standard http client (like [axios](https://github.com/axios/axios)) but these client does not support graphql `subscriptions`. `apollo-client` was the only one however it is not quiet simple as i would like.

Morever, `apollo-client` has been originally made for `react` and I love `vue`. There is a good [plugin](https://apollo.vuejs.org/guide/) for `vue`. I remember that configure apollo for Nuxt.js was such a pain and I had a lot of issue about the cache. I searched all Github to find a solution and i lost a lot of time. Now i have others projects with `vue` and graphql and I need a more simple tool for that.

## Features

- :zap: Send `query` and `mutation` request to your favorite graphql API
- :tada: Supports `subscription` request 
- :rainbow: Supports [variables](https://graphql.org/learn/queries/#variables) with your queries
- :octopus: Accept graphql query as string or as object (parsed with `graphl-tag`)
- :cyclone: Vue 3 plugin
  
## Get started

### Node.js && Browser

To declare your client, your just need the following line

```js
import { GraphqlClient } from 'graphql-friendly';

const myGraphqlClient = new GraphqlClient('http://localhost:10000/v1/graphql');
```

Then, you just have to call the method you want :

#### query

```js
import gql from 'graphql-tag';

const createUser = gql`
  mutation createUser($email: String!) {
    insert_users(objects: {
      email: $email,
      nickname: "fefe",
      password: "zefe"
    }) {
      returning {
        id
      }
    }
  }
`;

const answer = await myGraphqlClient.query({
  query: CreateUser,
  variables: { email: 'toto2@toto.com' },
});

console.log(answer) // { insert_users: { ... }}
```

#### mutation

For the moment, `.mutation` is exactly the same as `.query`.

#### subscription

Graphql allows you to make subscription. To do this, you juste have to call the `subscribe` method and subscribe the answer

```js
const myObserver = myGraphqlClient.subscribe({ query: 'subscription { users { id } }' })

myObserver.subscribe({
  next(data) { // When an event is received from the server
    console.log(data);
  },
  error(err) { // When an event occured
    console.log(err);
  },  
});
```

### With Vue 3

```js
import { createApp } from 'vue';
import GraphqlFriendly from 'graphql-friendly';

const app = createApp(App);

app.use(GraphqlFriendly, {
  url: 'http://localhost:10000/v1/graphql',
});
```

After installing the plugin, the client is accessible in your components as `this.$graphqlClient`.

## Documentation

### `query({ query, variables })`

- `query`: string | object - The query can be a graphql string or parsed query with [graphql-tag](https://github.com/apollographql/graphql-tag).
- `variables`: object - Variables provided to your query

`returns` the graphql answer

### `mutation({ query, variables })`

- `query`: string | object - The query can be a graphql string or parsed query with [graphql-tag](https://github.com/apollographql/graphql-tag).
- `variables`: object - Variables provided to your query

`returns` the graphql answer

### `subscribe({ query, variables })`

- `query`: string | object - The query can be a graphql string or parsed query with [graphql-tag](https://github.com/apollographql/graphql-tag).
- `variables`: object - Variables provided to your query

`returns` an observable that you can subscribe

```js
.subscribe({
  next(data) { // When an event is received from the server
    console.log(data);
  },
  error(err) { // When an event occured
    console.log(err);
  },  
});
```

