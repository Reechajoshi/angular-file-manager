/*jslint node: true */
var express = require('express');
var mime = require('mime');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs.extra'));
var path = require('path');
var multer  = require('multer');
var routes = express.Router();
var dateformat = require('../utils/dateformat');
var pathResolver = require('../utils/pathresolver');
var async = require('async');
var Archiver = require('archiver');
var watch = require('node-watch');
var io = null;

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(pathResolver.baseDir(req), pathResolver.pathGuard(req.body.destination)));
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

var upload = multer({ storage: storage });

routes.post('/initial',function(req,res,next){
	var initialFolder = req.body.initialFolder;
	process.env.DATA_DIR = initialFolder;
  watch(initialFolder, function(filename) {
      io.emit('change detected',{data:filename});
    });
    res.send("watching started");
});

routes.post('/list', function (req, res, next) {
  var promise;
  var self = this;
  var fsPath = path.join(pathResolver.baseDir(req), pathResolver.pathGuard(req.body.path));
  promise = fs.statAsync(fsPath).then(function(stats) {
    if(!stats.isDirectory()) {
      throw new Error("Directory " + fsPath + ' does not exist!');
    }
  });

  promise = promise.then(function() {
    return fs.readdirAsync(fsPath);
  });

  promise = promise.then(function(fileNames) {

    return Promise.map(fileNames, function(fileName) {

      var filePath = path.join(fsPath, pathResolver.pathGuard(fileName));


      return fs.statAsync(filePath).then(function(stat) {
        return {
          name: fileName,
          // rights: "Not Implemented", // TODO
          rights: "drwxr-xr-x",
          size: stat.size,
          date: dateformat.dateToString(stat.mtime),
          type: stat.isDirectory() ? 'dir' : 'file',
        };
      });
    });
  });

  promise = promise.then(function(files) {
    res.status(200);
    res.send({
      "result": files
    });
  });

  promise = promise.catch(function(err) {
    res.status(500);
    res.send({
      "result": {
        "success": false,
        "error": err
      }
    });
  });

  return promise;
});

routes.get('/download', function (req, res, next) {

  var filePath = path.join(pathResolver.baseDir(req), pathResolver.pathGuard(req.query.path));
  var fileName = path.basename(filePath);
  var promise;

  promise = fs.statAsync(filePath);

  promise = promise.then(function(stat) {

    if(!stat.isFile()) {
      throw new Error("Cannot access file " + filePath + " (or is no file)");
    }
   
    var mimeType = mime.lookup(filePath);

    res.setHeader('Content-disposition', 'attachment; filename=' + encodeURIComponent(fileName));
    res.setHeader('Content-type', mimeType);

    var filestream = fs.createReadStream(filePath);
    filestream.pipe(res);
  });

  promise = promise.catch(function(err,stats) {

    res.status(500);
    res.send({
      "result": {
        "success": false,
        "error": JSON.stringify(err),
        "stats": stats
      }
    });
  });

  return promise;
});

routes.get('/multidownload', function (req, res, next) {
  	var files = req.query.items;

    var mimeType = 'application/zip';
    var filename = req.query.toFilename;

    res.setHeader('Content-disposition', 'attachment; filename='+filename);
    res.setHeader('Content-type', mimeType);

    var zip = Archiver('zip');

    // Send the file to the page output.
    zip.pipe(res);
    for(var i in files) {
    	var filePath = path.join(pathResolver.baseDir(req), pathResolver.pathGuard(files[i]));
	    zip.file(filePath, { name: path.basename(files[i]) });
	}
    zip.finalize();

});

routes.post('/upload', upload.any(), function (req, res, next) {
  res.status(200);
  res.send({
    "result": {
      "success": true,
      "error": null
    }
  });
});


routes.post('/remove', upload.any(), function (req, res, next) {

  var filePaths = req.body.items.map(function(filePath){
    return path.join(pathResolver.baseDir(req), pathResolver.pathGuard(filePath));
  });

  var deleteFolderRecursive = function(path) {
	var files = [];
    if( fs.existsSync(path) ) {
    	if(fs.lstatSync(path).isDirectory()){
    		files = fs.readdirSync(path);
	        files.forEach(function(file,index){
	            var curPath = path + "/" + file;
	            if(fs.lstatSync(curPath).isDirectory()) { // recurse
	                deleteFolderRecursive(curPath);
	            } else { // delete file
	                fs.unlinkSync(curPath);
	            }
	        });
	        fs.rmdirSync(path);
    	}else{
    		fs.unlinkSync(path);	
    	}
        
    }
};

	async.each(filePaths,function(path,callback){
			deleteFolderRecursive(path);
			callback()
	},function(err){
		if(!err)
		res.send({
	          "result": {
	            "success": true,
	            "error": null
	          }
	     });
	})

});

routes.post('/createFolder', upload.any(), function (req, res, next) {

  var folderPath = path.join(pathResolver.baseDir(req), pathResolver.pathGuard(req.body.newPath));

  var promise = fs.mkdirAsync(folderPath, 0o777);

  promise = promise.then(function() {
    res.status(200);
    res.send({
      "result": {
        "success": true,
        "error": null
      }
    });
  });

  promise = promise.catch(function(err) {
    res.status(500);
    res.send({
      "result": {
        "success": false,
        "error": err
      }
    });
  });

  return promise;
});

routes.post('/rename', function (req, res, next) {

  var oldPath = path.join(pathResolver.baseDir(req), pathResolver.pathGuard(req.body.item));
  var newPath = path.join(pathResolver.baseDir(req), pathResolver.pathGuard(req.body.newItemPath));

  var promise = fs.renameAsync(oldPath, newPath);

  promise = promise.then(function() {
    res.status(200);
    res.send({
      "result": {
        "success": true,
        "error": null
      }
    });
  });

  promise = promise.catch(function(err) {
    res.status(500);
    res.send({
      "result": {
        "success": false,
        "error": err
      }
    });
  });

  return promise;
});

routes.post('/copy', function (req, res, next) {
	if(req.body.items.length>1){
		async.each(req.body.items,function(file,callback){
			 var oldPath = path.join(pathResolver.baseDir(req), pathResolver.pathGuard(file));
			 var filename = oldPath.replace(/^.*[\\\/]/, '')
			 var newPath = path.join(pathResolver.baseDir(req), pathResolver.pathGuard(req.body.newPath+'/'+filename));
			 fs.copyAsync(oldPath, newPath).then(function(){
			 	callback();
			 }).catch(function(err){
			 	callback(err);
			 });
		},function(err){
			if(err){
				res.send({
				      "result": {
				        "success": false,
				        "error": err
				      }
				});
			}else{
				 res.send({
				      "result": {
				        "success": true,
				        "error": null
				      }
				});
			}
		})
	}else{
		  var oldPath = path.join(pathResolver.baseDir(req), pathResolver.pathGuard(req.body.items[0]));
		  var newPath = path.join(pathResolver.baseDir(req), pathResolver.pathGuard(req.body.newPath));
		  var promise = fs.copyAsync(oldPath, newPath);

		  promise = promise.then(function() {
		    res.status(200);
		    res.send({
		      "result": {
		        "success": true,
		        "error": null
		      }
		    });
		  });

		  promise = promise.catch(function(err) {
		    res.status(500);
		    res.send({
		      "result": {
		        "success": false,
		        "error": "File Already exists in the path"
		      }
		    });
		  });

		  return promise;
	}
});


routes.post('/move', function (req, res, next) {

  var targets = req.body.items.map(function (filePath){
    return path.join(pathResolver.baseDir(req), pathResolver.pathGuard(filePath));
  });
  var newPath = path.join(pathResolver.baseDir(req), pathResolver.pathGuard(req.body.newPath));
  
  var i = targets.length;
  targets.forEach(function (target){
    fs.rename(target,path.join(newPath,path.basename(target)),function (err){
      i -= 1;
      if (err){
        res.status(500);
        res.send({
          "result": {
            "success": false,
            "error": err
          }
        });
      } else if (i === 0){
        res.send({
          "result": {
            "success": true,
            "error": null
          }
        });
      }
    });
  });
});
module.exports = {
  connection: function(ioInput,socket){
    io=ioInput;
  },
  setup:function(){
    return routes;
  }
};