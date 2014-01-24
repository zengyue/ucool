'use strict';

var url = require('url'),
  less = require('less'),
  fs = require('fs'),
  http = require('http'),
  Q = require('q');

module.exports = function (app) {
  var remoteUrl = 'http://g.tbcdn.cn',
    //baseDir = '/Users/zengyue.yezy/Sites/gitlab';
    baseDir = 'D:\\works\\htdocs\\git\\gitlab';


  function getFileData(path, index, result){
    var localPath = baseDir + path,
      remotePath = remoteUrl + path,
      deferred = Q.defer();
    fs.exists(localPath, function(exists){
      //获取本地文件
      if(exists){
        fs.readFile(localPath, 'utf-8', deferred.makeNodeResolver());
      }
      else{
        http.get(remotePath, deferred.makeNodeResolver());
      }
    })
    return deferred.promise;
  }

  app.get('*', function (req, res) {
    var uri = url.parse(req.url),
      pathname = uri.pathname,
      query = uri.query || '',
      path = query.split('?')[1],
      fetchList = [];
    if(path){
      path = path.split(',');
      path.forEach(function(item){
        fetchList.push(getFileData(pathname + item));
      })
      // fetchList.push(readFileData('/Users/zengyue.yezy/Sites/gitlab/fi/insure/seller/protect/js/item.js'))
      Q.all(fetchList).done(function(data){
        // console.log(data);
        res.write(data[0]);
        res.end();
      })
    }
    else{
      res.end();
    }
  });

};
