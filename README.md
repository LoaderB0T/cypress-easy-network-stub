
# cypress-easy-network-stub
An easy class to mock a lot of network requests in cypress

Example:
```typescript
const posts = [0, 1, 2, 3, 4, 5].map(x => ({ postId: x, text: `test${x}` }));

const blogStub = new CypressEasyNetworkStub('/MyServer/api/Blog');

blogStub.init();

blogStub.stub('GET', 'posts', (body, params) => {
  return posts;
});

blogStub.stub('GET', 'posts/{id:number}', (body, params) => {
  return posts.find(x => x.postId === params.id);
});

blogStub.stub('POST', 'posts', (body, params) => {
  posts.push({ postId: body.postId, text: body.text });
});
```

Strongly typed api parameters:
![28e1ce4ebde1baee92f4cb40a23452ab](https://user-images.githubusercontent.com/37637338/116729565-9955ab00-a9e7-11eb-828e-f88979f21452.gif)
