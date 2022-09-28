const axios = require("axios");

const get = async (url, { headers } = { headers: {} }) => {
  const response = await axios.get(url, {
    headers,
  });

  return response.data;
};

const post = async (url, data, { headers } = { headers: {} }) => {
  const response = await axios.post(url, data, {
    headers,
  });

  return response.data;
};

// GET
(async () => {
  const endpoint = "https://jsonplaceholder.typicode.com/todos/1";

  console.log(`-> GET ${endpoint}`);
  const data = await get(endpoint);

  console.log(`<- got ${JSON.stringify(data)}`);
})();

// POST
(async () => {
  const endpoint = "https://jsonplaceholder.typicode.com/posts";
  const requestBody = JSON.stringify({
    title: "foo",
    body: "bar",
    userId: 1,
  });

  console.log(`-> POST ${endpoint}; body: ${JSON.stringify(requestBody)}`);
  const data = await post(endpoint, requestBody, {
    headers: { "Content-type": "application/json; charset=UTF-8" },
  });

  console.log(`<- got ${JSON.stringify(data)}`);
})();
