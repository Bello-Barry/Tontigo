const https = require('https');
const fs = require('fs');

// Simple dot env loader
const envConfig = fs.readFileSync('.env.local', 'utf8').split('\n');
const env = {};
envConfig.forEach(line => {
  const parts = line.split('=');
  if(parts.length > 1) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim();
    if(key && !key.startsWith('#')) {
      env[key] = val;
    }
  }
});

function getToken(type) {
    return new Promise((resolve, reject) => {
        const isCollection = type === 'collection';
        const subKey = isCollection ? env['MOMO_COLLECTION_SUBSCRIPTION_KEY'] : env['MOMO_DISBURSEMENT_SUBSCRIPTION_KEY'];
        const userId = isCollection ? env['MOMO_COLLECTION_API_USER_ID'] : env['MOMO_DISBURSEMENT_API_USER_ID'];
        const apiKey = isCollection ? env['MOMO_COLLECTION_API_KEY'] : env['MOMO_DISBURSEMENT_API_KEY'];
        const urlStr = env['MTN_MOMO_BASE_URL'] + `/${type}/token/`;

        if (!subKey || !userId || !apiKey) {
            return reject(new Error(`Missing config for ${type}`));
        }

        const auth = Buffer.from(`${userId}:${apiKey}`).toString('base64');
        const url = new URL(urlStr);
        
        const options = {
            hostname: url.hostname,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Ocp-Apim-Subscription-Key': subKey,
                'Authorization': `Basic ${auth}`,
                'Content-Length': 0
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve({ success: true, type, statusCode: res.statusCode, data: JSON.parse(data) });
                    } catch (e) {
                        resolve({ success: true, type, statusCode: res.statusCode, data });
                    }
                } else {
                    resolve({ success: false, type, statusCode: res.statusCode, data });
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.end();
    });
}

async function runTests() {
    console.log('--- Test MTN MoMo Credentials ---');
    try {
        console.log('Testing Collection Token...');
        const collToken = await getToken('collection');
        console.log('Collection Token Result:', collToken.success ? 'SUCCESS' : 'FAILED');
        console.dir(collToken, { depth: null });

        console.log('\nTesting Disbursement Token...');
        const disbToken = await getToken('disbursement');
        console.log('Disbursement Token Result:', disbToken.success ? 'SUCCESS' : 'FAILED');
        console.dir(disbToken, { depth: null });
        
    } catch (e) {
        console.error('Error during tests:', e);
    }
}

runTests();
