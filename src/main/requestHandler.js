const runtime = require('postman-runtime');
const sdk = require('postman-collection');

async function handleRequest(requestData) {
  return new Promise((resolve) => {
    try {
        const { url, method, headers, body, bodyFormData, bodyUrlEncoded, bodyType, preRequestScript, testScript, environment } = requestData;

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

        if (bodyType === 'form-data' && bodyFormData) {
            requestDefinition.body = {
                mode: 'formdata',
                formdata: bodyFormData.map(item => ({
                    key: item.key,
                    value: item.value,
                    type: 'text' // We currently only support text input in UI
                }))
            };
        } else if (bodyType === 'x-www-form-urlencoded' && bodyUrlEncoded) {
            requestDefinition.body = {
                mode: 'urlencoded',
                urlencoded: bodyUrlEncoded.map(item => ({
                    key: item.key,
                    value: item.value
                }))
            };
        } else if (body) {
             // Default to raw (text/json)
            requestDefinition.body = {
                mode: 'raw',
                raw: body
            };
        }

        const requestItem = new sdk.Item({
            name: 'Request',
            request: requestDefinition
        });

        if (preRequestScript) {
            requestItem.events.add({
                listen: 'prerequest',
                script: {
                    type: 'text/javascript',
                    exec: preRequestScript
                }
            });
        }

        if (testScript) {
            requestItem.events.add({
                listen: 'test',
                script: {
                    type: 'text/javascript',
                    exec: testScript
                }
            });
        }

        collection.items.add(requestItem);

        // Run the collection
        const runner = new runtime.Runner();

        let responseData = null;
        let errorData = null;
        let testResults = [];
        let consoleLogs = [];

        // Prepare Environment
        let environmentScope = undefined;
        if (environment) {
            environmentScope = new sdk.VariableScope({
                name: 'Environment',
                values: Object.keys(environment).map(key => ({ key, value: environment[key] }))
            });
        }

        runner.run(collection, {
            iterationCount: 1,
            stopOnError: true,
            environment: environmentScope
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
                assertion: function (cursor, assertions) {
                    if (assertions) {
                        assertions.forEach(assertion => {
                            testResults.push({
                                name: assertion.assertion,
                                passed: !assertion.error,
                                error: assertion.error ? assertion.error.message : null
                            });
                        });
                    }
                },
                console: function (cursor, level, ...messages) {
                    consoleLogs.push({
                        level: level,
                        messages: messages.map(m => String(m))
                    });
                },
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
                        responseData.testResults = testResults;
                        responseData.consoleLogs = consoleLogs;
                        resolve(responseData);
                    } else {
                        resolve({
                             status: 0,
                             statusText: 'No Response',
                             headers: {},
                             data: '',
                             testResults: testResults,
                             consoleLogs: consoleLogs
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
