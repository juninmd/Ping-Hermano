const { handleRequest } = require('../src/main/requestHandler');

async function verifySandbox() {
    console.log('Verifying sandbox libraries...');
    const testScript = `
        var results = {};
        try { results.tv4 = typeof tv4 !== 'undefined'; } catch(e) { results.tv4 = false; }
        try { results.CryptoJS = typeof CryptoJS !== 'undefined'; } catch(e) { results.CryptoJS = false; }
        try { results.ajv = typeof require('ajv') !== 'undefined'; } catch(e) { results.ajv = false; }
        try { results.uuid = typeof require('uuid') !== 'undefined'; } catch(e) { results.uuid = false; }
        try { results.xml2js = typeof require('xml2js') !== 'undefined'; } catch(e) { results.xml2js = false; }
        try { results.cheerio = typeof cheerio !== 'undefined'; } catch(e) { results.cheerio = false; }
        try { results.lodash = typeof _ !== 'undefined'; } catch(e) { results.lodash = false; }
        try { results.momentRequire = typeof require('moment') !== 'undefined'; } catch(e) { results.momentRequire = false; }

        console.log('Sandbox Check Results: ' + JSON.stringify(results));
    `;

    const requestData = {
        url: 'https://echo.free.beeceptor.com',
        method: 'GET',
        testScript: testScript
    };

    try {
        const response = await handleRequest(requestData);

        let logs = [];
        if (response.consoleLogs) {
            logs = response.consoleLogs.map(l => l.messages.join(' '));
        }

        const resultLog = logs.find(l => l.startsWith('Sandbox Check Results: '));
        if (!resultLog) {
            console.error('FAILED: No result log found from sandbox.');
            process.exit(1);
        }

        const results = JSON.parse(resultLog.replace('Sandbox Check Results: ', ''));
        const expected = ['tv4', 'CryptoJS', 'ajv', 'uuid', 'xml2js', 'cheerio', 'lodash', 'momentRequire'];

        const missing = expected.filter(lib => !results[lib]);

        if (missing.length > 0) {
            console.error('FAILED: Missing libraries in sandbox:', missing.join(', '));
            process.exit(1);
        }

        console.log('SUCCESS: All expected libraries are present in the sandbox.');
        process.exit(0);

    } catch (error) {
        console.error('FAILED: Exception during verification:', error);
        process.exit(1);
    }
}

verifySandbox();
