const axios = require('axios');

async function handleRequest(requestData) {
  try {
    const { url, method, headers, body } = requestData;

    // Normalize headers
    const requestHeaders = {};
    if (Array.isArray(headers)) {
        headers.forEach(h => {
            if (h.key && h.value) {
                requestHeaders[h.key] = h.value;
            }
        });
    } else if (typeof headers === 'object') {
        Object.assign(requestHeaders, headers);
    }

    const config = {
      url,
      method,
      headers: requestHeaders,
      data: body ? body : undefined,
      validateStatus: () => true,
      transformResponse: [(data) => data]
    };

    const response = await axios(config);

    return {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data
    };
  } catch (error) {
    return {
      error: error.message,
      status: 0,
      statusText: 'Network Error',
      headers: {},
      data: ''
    };
  }
}

module.exports = { handleRequest };
