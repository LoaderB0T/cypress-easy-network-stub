[![npm](https://img.shields.io/npm/v/cypress-easy-network-stub?color=%2300d26a&style=for-the-badge)](https://www.npmjs.com/package/cypress-easy-network-stub)

# cypress-easy-network-stub

An easy class to mock a lot of network requests in cypress.

## Motivation 💥

When running tests in cypress, sometimes you want to mock all network requests. Especially when running tests in a CI environment. This package provides an easy and type safe way to mock network requests for a whole API.

## Features 🔥

✅ Easy to setup and use

✅ Type safe url and query parameters

✅ Add your own parameter matchers

✅ Detailed logging of all stubbed requests

✅ Works synchronously and asynchronously

✅ Supports failing of stubbed requests

✅ No production dependencies (You need to have cypress installed, of course)

The primary use case for this package is to create a mock server for your tests so that they do not need real network requests.

## Built With 🔧

- [TypeScript](https://www.typescriptlang.org/)

## Usage Example 🚀

```typescript
const posts = [0, 1, 2, 3, 4, 5].map(x => ({ postId: x, text: `test${x}` }));

const blogStub = new CypressEasyNetworkStub('/MyServer/api/Blog');

blogStub.init();

blogStub.stub('GET', 'posts', (body, params) => {
  return posts;
});

// Match Example: GET: /MyServer/api/Blog/posts/123
blogStub.stub('GET', 'posts/{id:number}', (body, params) => {
  return posts.find(x => x.postId === params.id);
});

// Match Example: POST: /MyServer/api/post
blogStub.stub('POST', 'posts', (body, params) => {
  posts.push({ postId: body.postId, text: body.text });
});

// Match Example: POST: /MyServer/api/Blog/test/true?query=myValue&secondQuery=myOtherValue
// Note: The order of the query parameters is not important
blogStub.stub('POST', 'test/{something:boolean}?{query:string}&{secondQuery:number}', (body, params) => {
  console.log(params.something);
  console.log(params.query);
  console.log(params.secondQuery);
});
```

Strongly typed api parameters:

![28e1ce4ebde1baee92f4cb40a23452ab](https://user-images.githubusercontent.com/37637338/116729565-9955ab00-a9e7-11eb-828e-f88979f21452.gif)

## Contributing 🧑🏻‍💻

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License 🔑

Distributed under the MIT License. See `LICENSE.txt` for more information.

## Contact 📧

Janik Schumacher - [@LoaderB0T](https://twitter.com/LoaderB0T) - [linkedin](https://www.linkedin.com/in/janikschumacher/)

Project Link: [https://github.com/LoaderB0T/cypress-easy-network-stub](https://github.com/LoaderB0T/cypress-easy-network-stub)
