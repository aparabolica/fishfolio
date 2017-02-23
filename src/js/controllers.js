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
