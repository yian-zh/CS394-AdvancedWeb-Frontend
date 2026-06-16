const https = require('https');
const fs = require('fs');

const token = process.env.FIGMA_TOKEN || 'YOUR_FIGMA_TOKEN_HERE';
const fileKey = 'X7ynD7Za2zwCgKnLoQVl85';
const nodeId = '1:638';

const options = {
  hostname: 'api.figma.com',
  path: `/v1/files/${fileKey}/nodes?ids=${nodeId}`,
  method: 'GET',
  headers: {
    'X-Figma-Token': token
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    fs.writeFileSync('figma_fleet_correct.json', data);
    console.log('Correct Fleet Figma node fetched successfully.');
  });
});

req.on('error', (e) => {
  console.error(e);
});

req.end();
