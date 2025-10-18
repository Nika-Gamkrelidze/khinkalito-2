// Probes multiple OAuth2 token endpoints for iPay, using .env credentials
// Prints status and short response for each attempt

import 'dotenv/config';

const urls = [
  'https://api.bog.ge/security/realms/ipay/protocol/openid-connect/token',
  'https://sso.bog.ge/auth/realms/ipay/protocol/openid-connect/token',
  'https://ipay.ge/opay/oauth2/token',
  'https://ipay.ge/opay/oauth/token',
  'https://security.bog.ge/realms/ipay/protocol/openid-connect/token',
  'https://security.bog.ge/auth/realms/ipay/protocol/openid-connect/token',
  'https://security.bog.ge/realms/ipsp/protocol/openid-connect/token',
  'https://api.bog.ge/security/realms/ipsp/protocol/openid-connect/token',
  // OPAY realm guesses
  'https://api.bog.ge/security/realms/opay/protocol/openid-connect/token',
  'https://security.bog.ge/realms/opay/protocol/openid-connect/token',
  'https://sso.bog.ge/auth/realms/opay/protocol/openid-connect/token',
];

const clientId = process.env.IPAY_CLIENT_ID;
const clientSecret = process.env.IPAY_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error('Missing IPAY_CLIENT_ID/SECRET in .env');
  process.exit(1);
}

const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

async function tryEndpoint(url, mode) {
  try {
    let res;
    if (mode === 'basic') {
      res = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          authorization: `Basic ${basic}`,
        },
        body: 'grant_type=client_credentials',
      });
    } else {
      const body = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      });
      res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body,
      });
    }
    const text = await res.text();
    console.log(`[ ${url} | ${mode} ] -> ${res.status} ${text.slice(0, 200).replace(/\n/g, ' ')}`);
  } catch (e) {
    console.log(`[ ${url} | ${mode} ] -> ERR ${e.message}`);
  }
}

for (const url of urls) {
  // Sequential to avoid rate limits
  await tryEndpoint(url, 'basic');
  await tryEndpoint(url, 'form');
}


