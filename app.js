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

  const filePath = path.join(__dirname, 'uploadfile');
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

});


app.get('/download1', (req, res) => {

  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Transfer-Encoding', 'chunked'); //Transfer encoding set manually for clarity even if no content-length header's set.

  let count = 0;

  const interval = setInterval(() => {
    count++;
    const chunk = `Chunk ${count}\n`;
    res.write(chunk);
    res.flushHeaders();
    console.log("Sent:", chunk.trim());

    if (count === 15) {
      clearInterval(interval);
      res.end();   // End response immediately. Explicit closing 0 byte not needed. 
    }
  }, 1000);
});


app.get('/download2', (req, res) => {
  const CHUNK_SIZE = 1024 * 1024; // 1 MB chunks
  const filePath = path.join(__dirname, 'downloadfile');
  //res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Transfer-Encoding', 'chunked');

  const readStream = fs.createReadStream(filePath, { highWaterMark: CHUNK_SIZE });

  readStream.on('data', chunk => {
    res.write(chunk); 
    console.log('Sent chunk:', chunk.length);
  });

  readStream.on('end', () => {
    res.end(); 
    console.log('Finished streaming file');
  });

});


app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
