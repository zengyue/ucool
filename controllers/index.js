'use strict';

var url = require('url'),
  less = require('less'),
  fs = require('fs'),
  Promise = require('promise');

module.exports = function (app) {
  var remoteUrl = 'http://g.tbcdn.cn',
    baseDir = '/Users/zengyue.yezy/Sites/gitlab';

  //获取本地文件
  function readFileData(path){
    var promise = new Promise(function (resolve, reject) {
      fs.readFile(path, function (err, data) {
        console.log(data);
        if (err){
          reject(err);
        }
        else{
          resolve(data);
        }
      });
      return promise;
    });
  }

  //获取远程文件
  function fetchFileData(path){
    var promise = new Promise(function (resolve, reject) {
      fs.readFile(path, function (err, data) {
        if (err){
          reject(err);
        }
        else{
          resolve(res);
        }
      });
      return promise;
    });
  }

  function getFileData(path, index, result){
    var localPath = baseDir + path,
      remotePath = remoteUrl + path;
    fs.exists(localPath, function(exists){
      if(exists){
        readFileData(localPath).done(function(){
        });
      }
      else{
        fetchFileData(remotePath);
      }
    })
  }

  app.get('*', function (req, res) {
    var uri = url.parse(req.url),
      pathname = uri.pathname,
      query = uri.query || '',
      path = query.split('?')[1],
      fetchList = [];
    if(path){
      path = path.split(',');
      // path.forEach(function(item){
      //   fetchList.push(getFileData(pathname + item));
      // })
      fetchList.push(readFileData('/Users/zengyue.yezy/Sites/gitlab/fi/insure/seller/protect/js/item.js'))
      Promise.all(fetchList).done(function(){
        console.log(arguments);
        res.end();
      })
    }
    else{
      res.end();
    }
  });

};
