const runtime = require('postman-runtime');
const sdk = require('postman-collection');

async function handleRequest(requestData) {
  return new Promise((resolve) => {
    try {
        const { url, method, headers, body } = requestData;

        // Create a collection
        const collection = new sdk.Collection();

        // Construct headers for Postman SDK
        const headerList = [];
        if (Array.isArray(headers)) {
            headers.forEach(h => {
                if (h.key) headerList.push({ key: h.key, value: h.value });
            });
        } else if (typeof headers === 'object') {
            Object.keys(headers).forEach(key => {
                headerList.push({ key, value: headers[key] });
            });
        }

        // Create the Request Item
        const requestDefinition = {
            url: url,
            method: method || 'GET',
            header: headerList
        };

        if (body) {
            requestDefinition.body = {
                mode: 'raw',
                raw: body
            };
        }

        const requestItem = new sdk.Item({
            name: 'Request',
            request: requestDefinition
        });

        collection.items.add(requestItem);

        // Run the collection
        const runner = new runtime.Runner();

        let responseData = null;
        let errorData = null;

        runner.run(collection, {
            iterationCount: 1,
            stopOnError: true,
        }, function(err, run) {
            if (err) {
                console.error('Runner init error:', err);
                 return resolve({
                    error: err.message,
                    status: 0,
                    statusText: 'Error',
                    headers: {},
                    data: ''
                });
            }

            run.start({
                request: function (err, cursor, response, request, item, cookies, history) {
                    if (err) {
                        errorData = err;
                        return;
                    }

                    // Process response headers
                    const responseHeaders = {};
                    if (response.headers) {
                        response.headers.each(h => {
                            responseHeaders[h.key] = h.value;
                        });
                    }

                    // Process response body
                    let data = '';
                    if (response.stream) {
                        data = Buffer.from(response.stream).toString('utf8');
                    }

                    // Try to parse JSON if possible, consistent with previous behavior (axios transforms JSON automatically if possible, but here we return string usually unless we parse it. RequestStore expects string or object?)
                    // RequestStore.ts: if (result.data) ... if (typeof result.data === 'string' ... else JSON.stringify
                    // Axios automatically parses JSON. So we should try to parse it too if content-type says so, or just return string and let frontend handle?
                    // Axios default: tries to parse JSON.
                    try {
                        // Check content type
                        const contentType = responseHeaders['content-type'] || responseHeaders['Content-Type'];
                        if (contentType && contentType.includes('application/json')) {
                            data = JSON.parse(data);
                        }
                    } catch (e) {
                        // Keep as string
                    }

                    responseData = {
                        status: response.code,
                        statusText: response.status,
                        headers: responseHeaders,
                        data: data
                    };
                },
                done: function (err, summary) {
                    if (err || errorData) {
                        const e = err || errorData;
                         return resolve({
                            error: e.message,
                            status: 0,
                            statusText: 'Error',
                            headers: {},
                            data: ''
                        });
                    }

                    if (responseData) {
                        resolve(responseData);
                    } else {
                        resolve({
                             status: 0,
                             statusText: 'No Response',
                             headers: {},
                             data: ''
                        });
                    }
                }
            });
        });
    } catch (e) {
        resolve({
            error: e.message,
            status: 0,
            statusText: 'Exception',
            headers: {},
            data: ''
        });
    }
  });
}

module.exports = { handleRequest };
