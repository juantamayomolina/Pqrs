const fs = require('fs');
const http = require('http');

const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
let data = '';

const appendField = (name, value) => {
  data += `--${boundary}\r\n`;
  data += `Content-Disposition: form-data; name="${name}"\r\n\r\n`;
  data += `${value}\r\n`;
};

appendField('tipoDocumento', 'CC');
appendField('numeroDocumento', '999999');
appendField('nombreCompleto', 'Test User');
appendField('email', 'test@test.com');
appendField('esVulnerable', 'true');
appendField('tipoSolicitud', 'PETICION');
appendField('conceptoMotivo', 'Debugging Form');
appendField('contenido', 'Este es un contenido test');
data += `--${boundary}--\r\n`;

const request = http.request({
  method: 'POST',
  host: 'localhost',
  port: 3000,
  path: '/api/pqrs',
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': Buffer.byteLength(data)
  }
});

request.write(data);
request.end();

request.on('response', (res) => {
  console.log('Status:', res.statusCode);
  let str = '';
  res.on('data', chunk => str += chunk);
  res.on('end', () => console.log('Response:', str));
});
request.on('error', (err) => {
  console.error('Request Error:', err.message);
});
