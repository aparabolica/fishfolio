(function(_, undefined) {

  module.exports = function(app) {

    app.filter('byCommaTags', [
      '$filter',
      function($filter) {
        return function(input, tag, key) {
          if(!input || !tag || !key) {
            return input;
          } else {
            return _.filter(input, function(item) {
              var tags = $filter('i18n')(item[key]);
              return _.find(tags.split(','), function(t) {
                return t.trim() == tag;
              });
            });
          }
        }
      }
    ]);

    app.filter('commaSplit', [
      function() {
        return function(input) {
          input = input || '';
          arr = input.split(',');
          arr.forEach(function(item) {
            item = item.trim();
          });
          return arr;
        }
      }
    ]);

    app.filter('toHtml', [
      '$sce',
      function($sce) {
        return function(input) {
          input = input || '';
          return $sce.trustAsHtml(input);
        }
      }
    ]);

  }

})(window._);
