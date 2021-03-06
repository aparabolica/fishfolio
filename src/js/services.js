(function(undefined) {

  module.exports = function(app) {

    app.factory('FFService', [
      '$firebaseObject',
      '$firebaseArray',
      '$filter',
      function($firebaseObject, $firebaseArray, $filter) {
        return {
          getUniq: function(collection, parameter, split) {
            split = split || false;
            var all = [];
            collection.forEach(function(item) {
              var paramVals = [];
              if(item[parameter]) {
                if(split) {
                  var itemVal = $filter('i18n')(item[parameter]);
                  if(itemVal) {
                    itemVal.split(split).forEach(function(val) {
                      paramVals.push(val.trim());
                    });
                  }
                } else {
                  paramVals.push(item[parameter]);
                }
              }
              all = all.concat(paramVals);
            });
            var obj = {};
            all.forEach(function(val) {
              obj[val] = obj[val] ? (obj[val]) + 1 : 1;
            });
            var tags = [];
            for(var tag in obj) {
              tags.push({
                name: tag,
                count: obj[tag]
              });
            }
            return tags;
          }
        };
      }
    ]);

    app.factory('StorageService', [
      '$firebaseStorage',
      function($firebaseStorage) {
        var storageRef = firebase.storage().ref();
        return {
          put: function(files, putRef) {
            if(!_.isArray(files)) {
              files = [files];
            }
            var tasks = [];
            files.forEach(function(file, i) {
              var ref = storageRef.child(putRef + '/' + file.name);
              var storage = $firebaseStorage(ref);
              tasks.push(storage.$put(file));
            });
            return tasks;
          }
        }
      }
    ]);

  };

})();
