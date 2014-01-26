'use strict';

var url = require('url'),
  less = require('less'),
  fs = require('fs'),
  http = require('http'),
  Q = require('q');

module.exports = function (app) {
  //因为g.tbcdn.cn本来就要映射到本地，所以要通过a.tbcdn.cn获取
  var remoteHostname = 'a.tbcdn.cn',
    // baseDir = '/Users/zengyue.yezy/Sites/gitlab';
    baseDir = 'D:\\works\\htdocs\\git\\gitlab';
    // 
    // 
  
  //读取本地文件
  function readLocalFile(path, deferred){
    fs.readFile(path, function(err, data){
      if(err){
        deferred.reject(err);
      }
      else{
        //添加文件路径
        var prepend = new Buffer('/**' + path + '**/\n'),
          //在文件尾添加一个换行
          append = new Buffer('\n');
        // deferred.resolve(Buffer.concat([prepend, data, append]));
        deferred.resolve(data);
      }
    });
  }

  //获取远程文件
  function fetchRemoteFile(path, deferred){
    var options = {
      protocol: 'http:',
      hostname: remoteHostname,
      // port: 80,
      pathname: '/g' + path,
      method: 'GET',
      path: '/g' + path
    };

    var req = http.request(options, function(res) {
      var chunks = [];
      // chunks.push(new Buffer('/**' + url.format(options) + '**/\n'));
      res.on('data', function (chunk) {
        chunks.push(chunk);
      });
      res.on('end', function(){
        // chunks.push(new Buffer('\n'));
        var data = Buffer.concat(chunks);
        deferred.resolve(data);
      })
    });

    req.on('error', function(err) {
      deferred.reject(err);
    });
    req.end();
  }

  function getSrcPath(path){
    //把/x.x.x/ => /src/
    return path.replace(/\/\d+.\d+.\d+\//, '/src/');
  }


  //获取文件数据
  function getFileData(path, index, result){
    var localPath = baseDir + getSrcPath(path),
      deferred = Q.defer();
    fs.exists(localPath, function(exists){
      //获取本地文件
      if(exists){
        readLocalFile(localPath, deferred);
      }
      //获取线上文件
      else{
        fetchRemoteFile(path, deferred)
      }
    })
    return deferred.promise;
  }

  //获取请求文件路径
  function getFilesPath(urlStr){
    if(!urlStr){
      return;
    }
    var uri = url.parse(urlStr), //去掉-min, 使用源文件
      pathname = uri.pathname,
      query = uri.query || '',
      path = query.split('?')[1],
      paths = [];
    //http://g.tbcdn.cn/??a.js,b.js，这种形式的路径
    if(path){
      // path => a.ja,b.js
      path.split(',').forEach(function(item){
        paths.push(pathname + item);
      })
    }
    //http://g.tbcdn.cn/p/a.js?t=12,这种形式url
    else{
      //pathname => /p/a.js
      paths.push(pathname);
    }

    return paths;
  }

  function getExtName(url){
    var result = /\.[^\.]+$/.exec(url) || [],
      ext = result[0] || '';
    //ext => ['.css?t=123']
    //url有可能带有参数.css?t=123,所要去掉后面的这些
    return ext.replace(/\?\S*$/, '').toLowerCase();
  }

  var typeMap = {
    '.css': 'text/css',
    '.js': 'application/x-javascript',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif'
  }

  //设置conentType
  function setContentType (res, url) {
    var contentType = typeMap[getExtName(url)];
    res.setHeader("Content-Type", contentType);
  }

  app.get('*', function (req, res) {
    var paths = getFilesPath(req.url.replace(/-min./g, '.')), //去掉-min, 使用源文件
      fetchList = [];

    setContentType(res, req.url);

    //循环获取每个文件的内容
    paths.forEach(function(path){
      fetchList.push(getFileData(path));
    });
    //等所有的内容都完成后，依次添加
    Q.all(fetchList).done(function(data){
      data.forEach(function(item, index){
        res.write(item);
      })
      res.end();
    });
  });

};
