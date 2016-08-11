var express = require('express');
var fs = require('fs');
var path = require('path');
var resumable = require('./resumable-node.js')(path.join(__dirname, 'uploads'));
var app = express();
var multipart = require('connect-multiparty');

// Host most stuff in the public folder
app.use(express.static(__dirname + '/public'));

app.use(multipart());

// Uncomment to allow CORS
// app.use(function (req, res, next) {
//    res.header('Access-Control-Allow-Origin', '*');
//    next();
// });

// Handle uploads through Resumable.js
app.post('/upload', function(req, res){
  resumable.post(req, function(status, filename, original_filename, identifier){
    console.log('POST', status, original_filename, identifier);
    if (status === 'done') {
      //when all chunks uploaded, then createWriteStream to /uploads folder with filename
      var stream = fs.createWriteStream(path.join(__dirname, 'uploads', filename));
      //stitches the file chunks back together to create the original file. 
      resumable.write(identifier, stream);
      // stream.on('data', function(data){ console.log('data write'); });
      // stream.on('end', function(){ console.log('end write'); });
      // stream.on('pipe', function(){ console.log('pipe write'); });
      stream.on('finish', function(){ 
        console.log('finish write'); 
        //delete chunks after original file is re-created. 
        resumable.clean(identifier);
      });
    }
    res.send(status);
  });
});

// Handle status checks on chunks through Resumable.js
app.get('/upload', function(req, res){
    resumable.get(req, function(status, filename, original_filename, identifier){
        console.log('GET', status);
        res.send((status == 'found' ? 200 : 404), status);
    });
});

app.get('/download/:identifier', function(req, res){
	resumable.write(req.params.identifier, res);
});
app.get('/resumable.js', function (req, res) {
  var fs = require('fs');
  res.setHeader("content-type", "application/javascript");
  fs.createReadStream("../../resumable.js").pipe(res);
});

app.listen(3000);
