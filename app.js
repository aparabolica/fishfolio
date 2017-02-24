(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
function removeAccentMark(str) {
  var map = {
    a : /[\xE0-\xE6]/g,
    A : /[\xC0-\xC6]/g,
    e : /[\xE8-\xEB]/g,
    E : /[\xC8-\xCB]/g,
    i : /[\xEC-\xEF]/g,
    I : /[\xCC-\xCF]/g,
    o : /[\xF2-\xF6]/g,
    O : /[\xD2-\xD6]/g,
    u : /[\xF9-\xFC]/g,
    U : /[\xD9-\xDC]/g,
    c : /\xE7/g,
    C : /\xC7/g,
    n : /\xF1/g,
    N : /\xD1/g,
  };
  for(var l in map ) {
    var exp = map[l];
    str = str.replace(exp, l);
  }
  return str;
}

(function(undefined) {

  module.exports = function(app) {

    app.controller('SiteCtrl', [
      '$scope',
      '$state',
      '$filter',
      '$firebaseArray',
      '$firebaseObject',
      '$firebaseAuth',
      '$firebaseStorage',
      'FFService',
      'StorageService',
      'ngDialog',
      '$http',
      'Lang',
      function($scope, $state, $filter, $firebaseArray, $firebaseObject, $firebaseAuth, $firebaseStorage, FF, Storage, ngDialog, $http, Lang) {

        var ref = firebase.database().ref();
        $scope.authObj = $firebaseAuth();

        // Check auth
        $scope.$watch(function() {
          return $scope.authObj.$getAuth();
        }, function(auth) {
          $scope.user = auth;
        });

        // Lang editor
        $scope.langs = Lang.getLanguages();
        $scope.lang = Lang.get();
        $scope.$watch(function() {
          return Lang.get();
        }, function(lang) {
          $scope.lang = lang;
        });
        $scope.setLang = function(lang) {
          Lang.set(lang);
        };
        $scope.formLang = function(lang) {
          $scope.lang = lang;
        };

        $scope.$on('$stateChangeSuccess', function(ev, toState, toParams) {
          if(toParams.projectId) {
            $scope.viewingProject = toParams.projectId;
          } else {
            $scope.viewingProject = false;
          }
        });

        $scope.login = function() {
          $scope.authDialog = ngDialog.open({
            template: 'views/login.html',
            controller: 'AuthCtrl'
          });
        };

        $scope.$on('logged.in', function() {
          if($scope.authDialog) {
            $scope.authDialog.close();
            $scope.authDialog = null;
          }
        });

        $scope.filteredProjects = [];
        $scope.filtered = {};

        $scope.filterProject = function(key, val) {
          if($scope.filtered[key] == val)
            $scope.filtered[key] = null;
          else
            $scope.filtered[key] = val;
        };

        var projects = firebase.database().ref().child('projects');
        $scope.projects = $firebaseArray(projects);

        $scope.ghData = {};

        $scope.sort = 'year';
        $scope.reverse = false;

        $scope.projectSort = function(type) {
          return function(project) {
            switch (type) {
              case 'github':
                var total;
                if($scope.ghData[project.$id])
                  total = $scope.ghData[project.$id].latestCommit;
                if(!total)
                  total = -1;
                return -total;
                break;
              case 'name':
                return removeAccentMark($filter('i18n')(project.name));
                break;
              case 'year':
                return -project.launch_year;
                break;
            }
          }
        }

        $scope.resetFilters = function() {
          $scope.filtered = {};
          $scope.search = '';
          $scope.sort = 'year';
        }

        $scope.totalCommits = function(project) {
          var total;
          if($scope.ghData[project.$id])
            total = $scope.ghData[project.$id].totalCommits;
          return total;
        }
        $scope.latestCommit = function(project) {
          var total;
          if($scope.ghData[project.$id])
            total = $scope.ghData[project.$id].latestCommit;
          if(!total)
            total = -1;
          return total;
        }

        $scope.projects.$loaded(function(projects) {
          projects.forEach(function(project) {
            if(project.github) {
              $scope.ghData[project.$id] = {};
              $http.get('https://api.github.com/repos/'+ project.github + '/stats/commit_activity').then(function(data) {
                $scope.ghData[project.$id].commitActivity = data.data;
                $scope.ghData[project.$id].totalCommits = 0;
                data.data.forEach(function(week) {
                  $scope.ghData[project.$id].totalCommits += week.total;
                  if(week.total) {
                    $scope.ghData[project.$id].latestCommit = week.week;
                  }
                });
              });
            }
          });
        });

        $scope.projects.$watch(function() {
          $scope.tags = FF.getUniq($scope.projects, 'tags', ',');
          $scope.techs = FF.getUniq($scope.projects, 'techs', ',');
        });

        var about = firebase.database().ref().child('about');
        $scope.about = $firebaseObject(about);

        $scope.about.$loaded(function() {
          angular.element('body').css({opacity:1});
        });

        var aboutTranslatableFields = ['title', 'tagline', 'description'];
        $scope.settings = function() {
          $scope.about.$loaded(function(about) {
            about.$translatedKeys = [];
            for(var key in about) {
              if(aboutTranslatableFields.indexOf(key) != -1) {
                about.$translatedKeys.push(key);
                about[key] = langSplit(about[key]);
              }
            }
          });
          $scope.aboutDialog = ngDialog.open({
            template: 'views/settings.html',
            scope: $scope
          });
        };

        $scope.saveSettings = function(about) {
          aboutTranslatableFields.forEach(function(key) {
            if(about[key])
              about[key] = langJoin(about[key]);
          });
          about.$save().then(function() {
            $scope.aboutDialog.close();
            $scope.aboutDialog = null;
          });
        };

        $scope.new = function() {
          $scope.project = {};
          $scope.editDialog = ngDialog.open({
            template: 'views/project-edit.html',
            scope: $scope
          });
        };

        var projectTranslatableFields = ['name', 'description', 'long_description', 'tags', 'techs'];

        $scope.edit = function(project) {
          $scope.projectMedia = {};
          if(typeof project.$save !== 'function') {
            var project = firebase.database().ref().child('projects').child(project.$id);;
            $scope.project = $firebaseObject(project);
          } else {
            $scope.project = project;
          }
          $scope.project.$loaded(function(project) {
            project.$translatedKeys = [];
            for(var key in project) {
              if(projectTranslatableFields.indexOf(key) != -1) {
                project.$translatedKeys.push(key);
                project[key] = langSplit(project[key]);
              }
            }
          });
          $scope.editDialog = ngDialog.open({
            template: 'views/project-edit.html',
            scope: $scope
          });
        };

        $scope.saveProject = function(project, cb) {
          projectTranslatableFields.forEach(function(key) {
            if(project[key])
              project[key] = langJoin(project[key]);
          });
          if(project.$id) {
            project.$save().then(function() {
              if($scope.projectMedia.screenshots) {
                var tasks = Storage.put($scope.projectMedia.screenshots, 'screenshots/' + project.$id);
                tasks.forEach(function(task) {
                  task.$progress(function() {
                    // console.log(arguments);
                  });
                  task.$error(function() {
                    // console.log(arguments);
                  });
                  task.$complete(function() {
                    // console.log(arguments);
                  });
                });
              }
              $scope.editDialog.close();
              $scope.editDialog = null;
            });
          } else {
            $scope.projects.$add(project).then(function() {
              if($scope.projectMedia.screenshots) {
                var task = Storage.put($scope.projectMedia.screenshots, 'screenshots/' + project.$id);
                tasks.forEach(function(task) {
                  task.$progress(function() {
                    // console.log(arguments);
                  });
                  task.$error(function() {
                    // console.log(arguments);
                  });
                  task.$complete(function() {
                    // console.log(arguments);
                  });
                });
              }
              $scope.editDialog.close();
              $scope.editDialog = null;
            });
          }
        };

        $scope.remove = function(project) {
          if(confirm('Are you sure?')) {
            $scope.projects.$remove(project);
          }
        };

      }
    ]);

    app.controller('AuthCtrl', [
      'firebase',
      '$rootScope',
      '$scope',
      '$firebaseAuth',
      function(firebase, $rootScope, $scope, $firebaseAuth) {

        var ref = firebase.database().ref();
        $scope.authObj = $firebaseAuth();

        $scope.auth = function(credentials) {
          $scope.authObj.$signInWithEmailAndPassword(credentials.email, credentials.password).then(function(data) {
            $rootScope.$broadcast('logged.in');
            console.log('Logged in as: ' + data.uid);
          }, function(err) {
            console.log('Auth failed: ' + err);
          });
        };

      }
    ]);

    app.controller('ProjectCtrl', [
      '$scope',
      '$stateParams',
      '$firebaseObject',
      'ngDialog',
      '$http',
      function($scope, $stateParams, $firebaseObject, ngDialog, $http) {

        var project = firebase.database().ref().child('projects').child($stateParams.projectId);
        $scope.project = $firebaseObject(project);

        $scope.project.$loaded(function(project) {
          if(project.github) {
            $http.get('https://api.github.com/repos/'+ project.github + '/stats/commit_activity').then(function(data) {
              $scope.commitActivity = data.data;
              $scope.totalCommits = 0;
              data.data.forEach(function(week) {
                $scope.totalCommits += week.total;
              });
            });
          }
        });
      }
    ]);

  };

})();

},{}],2:[function(require,module,exports){
(function($, undefined) {

  module.exports = function(app) {

    app.directive('fullWidth', [
      function() {
        return {
          restrict: 'EA',
          scope: {
            offset: '=',
            fixHeight: '='
          },
          link: function(scope, element, attrs) {
            scope.offset = scope.offset || 0;
            $(window).on('resize', function() {
              var offset = $(element).offset();
              var windowWidth = $(window).width();
              $(element).css({
                width: windowWidth - offset.left - scope.offset,
                display: 'block'
              });
              if(scope.fixHeight) {
                $(element).height($(element).find('> *').height());
              }
            });
            $(window).resize();
          }
        }
      }
    ]);

    app.directive('webDevice', [
      '$sce',
      function($sce) {
        return {
          restrict: 'E',
          scope: {
            src: '=',
            width: '=',
            height: '='
          },
          transclude: true,
          replace: true,
          template: '<div class="web-device-container"><div class="web-device-content"><iframe ng-src="{{url}}" frameborder="0"></iframe></div><ng-transclude></ng-transclude</div>',
          link: function(scope, element, attrs) {
            scope.$watch('src', function(src) {
              scope.url = $sce.trustAsResourceUrl(scope.src);
            });
            $(window).on('resize', function() {
              // setTimeout(function() {
                var pWidth = $(element).parent().width();
                var pRatio = pWidth/scope.width;
                $(element).css({
                  width: scope.width * pRatio,
                  height: scope.height * pRatio
                });
                var elRatio = $(element).find('.web-device-content').width()/scope.width;
                $(element).find('iframe').css({
                  width: scope.width,
                  height: scope.height,
                  'transform-origin': 'top left',
                  transform: 'scale(' + elRatio + ')',
                  transition: 'all .2s linear',
                });
                // $(element).on('mouseenter', function() {
                //   $(element).find('iframe').css({
                //     transform: 'scale(' + elRatio + ')'
                //   });
                // });
                // $(element).on('mouseleave', function() {
                //   $(element).find('iframe').css({
                //     transform: 'scale(1)'
                //   });
                // });
              // }, 50);
            });
            $(window).resize();
          }
        }
      }
    ]);

    app.directive('ghChart', [
      '$timeout',
      function($timeout) {
        return {
          restrict: 'E',
          scope: {
            data: '=',
            backgroundColor: '=',
            lineColor: '=',
            width: '=',
            height: '=',
            tooltip: '=',
            tooltipLabel: '=',
            full: '='
          },
          replace: true,
          template: '<div></div>',
          link: function(scope, element, attrs) {

            $(element).addClass('gh-chart').highcharts({
              chart: {
                type: 'spline',
                backgroundColor: scope.backgroundColor || '#333',
                width: scope.width,
                height: scope.height,
                renderTo: 'gh-chart',
                events: {
                  load: function() {

                    var series = this.series[0];

                    scope.$watch('data', function(data) {
                      var d = [];
                      if(data) {
                        data.forEach(function(item) {
                          d.push([
                            new Date(item.week * 1000).toISOString(),
                            item.total
                          ]);
                        });
                      }
                      series.setData(d);
                    });

                  }
                }
              },
              title: false,
              subtitle: false,
              tooltip: {
                enabled: scope.tooltip,
                followPointer: true,
                backgroundColor: scope.backgroundColor || null,
                formatter: function() {
                  var label = '';
                  if(scope.tooltipLabel) {
                    label = '<span class="label"><b>' + scope.tooltipLabel + '</b></span><br/>';
                  }
                  return '<span class="gh-tooltip">' + label + '<span class="date">' + moment(this.key).format('L') + '</span> - <span class="total">' + this.y + ' commits</span></span>';
                },
                borderRadius: 0,
                shadow: false,
                style: {
                  color: scope.lineColor
                }
              },
              legend: {
                enabled: false,
                color: scope.lineColor
              },
              credits: {
                enabled: false
              },
              xAxis: {
                type: 'datetime',
                dateTimeLabelFormats: {
                  month: '%e. %b',
                  year: '%b'
                },
                title: 'Date',
                tickInterval: 7 * 24 * 3600 * 1000, // 1 week
                tickWidth: 0,
                visible: false
              },
              yAxis: {
                min: 0,
                title: 'Commits',
                visible: false
              },
              series: [{
                lineWidth: 1,
                marker: {
                  enabled: false
                },
                name: 'Commits',
                color: scope.lineColor || null,
                data: []
              }]
            });
          }
        }
      }
    ]);

  }

})(window.jQuery);

},{}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
(function(angular, undefined) {

  var langConfig = {
    'en': 'en',
    'pt': 'pt',
    'es': 'es'
  };

  String.prototype.langsplit = function(_regEx){
    if ('a~b'.split(/(~)/).length === 3){ return this.split(_regEx); }

    if (!_regEx.global) {
      _regEx = new RegExp(_regEx.source, 'g' + (_regEx.ignoreCase ? 'i' : ''));
    }

    var start = 0, arr=[];
    var result;
    while((result = _regEx.exec(this)) != null){
      arr.push(this.slice(start, result.index));
      if(result.length > 1) arr.push(result[1]);
      start = _regEx.lastIndex;
    }
    if(start < this.length) arr.push(this.slice(start));
    if(start == this.length) arr.push('');
    return arr;
  };

  langGetSplitBlocks = function(text) {
    var split_regex = /(<!--:[a-z]{2}-->|<!--:-->|\[:[a-z]{2}\]|\[:\]|\{:[a-z]{2}\}|\{:\})/gi;
    if(typeof text == 'string')
      return text.langsplit(split_regex);
    else
      return '';
  };

  langSplit = function(text) {
    var blocks = langGetSplitBlocks(text);
    return langSplitBlocks(blocks);
  }

  langSplitBlocks = function(blocks) {
    var result = new Object;
    for(var lang in langConfig) {
      result[lang] = '';
    }
    if(!blocks || !blocks.length)
      return result;
    if(blocks.length == 1) {
      var b = blocks[0];
      for(var lang in langConfig) {
        result[lang] += b;
      }
      return result;
    }
    var clang_regex = /<!--:([a-z]{2})-->/gi;
    var blang_regex = /\[:([a-z]{2})\]/gi;
    var slang_regex = /\{:([a-z]{2})\}/gi;
    var lang = false;
    var matches;
    for(var i = 0; i < blocks.length; ++i) {
      var b = blocks[i];
      if(!b.length) continue;
      matches = clang_regex.exec(b);
      clang_regex.lastIndex = 0;
      if(matches != null) {
        lang = matches[1];
        continue;
      }
      matches = blang_regex.exec(b);
      blang_regex.lastIndex = 0;
      if(matches != null) {
        lang = matches[1];
        continue;
      }
      matches = slang_regex.exec(b);
      slang_regex.lastIndex = 0;
      if(matches != null) {
        lang = matches[1];
        continue;
      }
      if(b == '<!--:-->' || b == '[:]' || b == '{:}') {
        lang = false;
        continue;
      }
      if(lang) {
        if(!result[lang]) result[lang] = b;
        else result[lang] += b;
        lang = false;
      } else { //keep neutral text
        for(var key in result) {
          result[key] += b;
        }
      }
    }
    return result;
  }

  langJoin = function(obj) {
    var str = '';
    for(var key in obj) {
      str += '[:' + key + ']' + obj[key];
    }
    return str;
  }

  module.exports = function(app) {
    app.factory('Lang', [
      '$cookies',
      '$stateParams',
      'gettextCatalog',
      function($cookies, $stateParams, gettextCatalog) {

        var userLang = navigator.language || navigator.userLanguage;

        var defaultLang;

        if($stateParams.lang) {
          defaultLang = _.find(langConfig, function(l) {
            return $stateParams.lang == l;
          });
        } else {
          defaultLang = _.find(langConfig, function(l) {
            return userLang.indexOf(l) !== -1;
          });
        }

        if(!$cookies.get('lang') || $stateParams.lang) {
          $cookies.put('lang', defaultLang || 'en');
        }

        var curLang = $cookies.get('lang');

        var gettextLang = 'en';
        if(curLang == 'pt')
          gettextLang = 'pt_BR';
        if(curLang == 'es')
          gettextLang = 'es_ES';

        gettextCatalog.setCurrentLanguage(gettextLang);

        return {
          get: function() {
            return curLang;
          },
          getLanguages: function() {
            return langConfig;
          },
          set: function(lang) {
            curLang = lang;
            $cookies.put('lang', lang);
            location.reload();
          }
        }
      }
    ]);

    app.filter('i18n', [
      'Lang',
      function(Lang) {
        return function(input) {
          if(typeof input == 'undefined')
            return '';
          else if(typeof input == 'object')
            return input[Lang.get()];
          else
            return langSplit(input)[Lang.get()];
        }
      }
    ]);

    app.filter('langJoin', [
      function() {
        return function(input) {
          return langJoin(input);
        }
      }
    ]);

    app.filter('langSplit', [
      function() {
        return function(input) {
          return langSplit(input);
        }
      }
    ]);
  };
})(window.angular);

},{}],5:[function(require,module,exports){
(function(angular, undefined) {

  var app = angular.module('fishfolio', [
    'fishfolio.config',
    'gettext',
    'ngCookies',
    'ngFileUpload',
    'ui.router',
    'ngDialog',
    'firebase',
    'textAngular'
  ]);

  require('./translations');

  app
  .config([
    '$stateProvider',
    '$urlRouterProvider',
    '$locationProvider',
    '$httpProvider',
    'firebaseConfig',
    function($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider, firebaseConfig) {

      firebase.initializeApp(firebaseConfig);

      $locationProvider.html5Mode({
        enabled: false
      });
      $locationProvider.hashPrefix('!');

      $stateProvider
      .state('home', {
        url: ''
      })
      .state('project', {
        url: '/projects/:projectId',
        controller: 'ProjectCtrl',
        templateUrl: 'views/project.html'
      });

    }
  ])
  .run([
    '$rootScope',
    function($rootScope) {
      $rootScope.$on('$stateChangeSuccess', function(ev, toState, toParams, fromState) {
        if((toState.name == 'project' || toState.name == 'home') && fromState.name) {
          $('html,body').animate({
            scrollTop: $('#projects').offset().top - 70
          });
        }
      });
    }
  ]);


  require('./i18n')(app);
  require('./services')(app);
  require('./controllers')(app);
  require('./directives')(app);
  require('./filters')(app);

  angular.element(document).ready(function() {
    angular.bootstrap(document, ['fishfolio']);
  });

})(window.angular);

},{"./controllers":1,"./directives":2,"./filters":3,"./i18n":4,"./services":6,"./translations":7}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
angular.module('fishfolio').run(['gettextCatalog', function (gettextCatalog) {
/* jshint -W100 */
    gettextCatalog.setStrings('es_ES', {"Currently viewing all projects.":"Está viendo todos los proyectos.","Currently viewing projects":"Está viendo proyectos","Login":"Iniciar Sesión","Logout":"Cerrar Sesión","No projects found!":"No se encontraron proyectos.","Ordering by":"Ordenando por","Project tags":"Etiquetas de proyecto","Projects":"Proyectos","Recent activity in code repository":"Actividad reciente en el repositorio de código","Reset filters":"Borrar filtros","Search projects...":"Buscar proyectos...","Settings":"Configuraciones","Technologies":"Tecnologías","Try another search.":"Intenta otra búsqueda.","View all projects":"Mostrar todos los proyectos","and":"y","containing":"conteniendo","latest projects":"últimos proyectos","name":"nombre","recent activity":"actividad reciente","tagged":"etiquetados como"});
    gettextCatalog.setStrings('pt_BR', {"Currently viewing all projects.":"Visualizando todos os projetos.","Currently viewing projects":"VIsualizando projetos","Login":"Entrar","Logout":"Sair","No projects found!":"Nenhum projeto encontrado!","Ordering by":"Ordernado por","Project tags":"Tags de projetos","Projects":"Projetos","Recent activity in code repository":"Atividade recente no repositório de código","Reset filters":"Limpar filtros","Search projects...":"Buscar projetos...","Settings":"Configurações","Technologies":"Tecnologias","Try another search.":"Tente outra busca.","View all projects":"Ver todos os projetos","and":"e","containing":"contendo","latest projects":"últimos projetos","name":"nome","recent activity":"atividade recente","tagged":"marcados como"});
/* jshint +W100 */
}]);
},{}]},{},[5]);
