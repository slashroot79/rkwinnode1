const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Healthy...');
});


app.post('/upload', (req, res) => {
  console.log('Streaming upload started..');

  const filePath = path.join(__dirname, 'infile');
  const writeStream = fs.createWriteStream(filePath);

  let received = 0;

  req.on('data', chunk => {
    received += chunk.length;
    writeStream.write(chunk);
    console.log('Chunk:', chunk.length, 'bytes');
  });

  req.on('end', () => { //invoked when 0 byte received from client or session timeout, 240s on Azure App Service
    writeStream.end();
    console.log('Streaming upload finished:', received, 'bytes');
    res.end('Streaming upload complete'); 
  });

  req.on('error', err => {
    console.error('Stream error:', err);
    res.status(500).end('Stream error');
  });
});


app.get('/download', (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Transfer-Encoding', 'chunked'); //Set manually for clarity. No content-length header set.

  let count = 0;

  const interval = setInterval(() => {
    count++;
    const chunk = `Chunk ${count}\n`;
    res.write(chunk);
    console.log("Sent:", chunk.trim());

    if (count === 5) {
      clearInterval(interval);
      res.end();   // <--- this is the server-side “0 chunk” equivalent
    }
  }, 1000);
});


app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
