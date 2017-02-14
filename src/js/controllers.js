(function(undefined) {

  module.exports = function(app) {

    app.controller('SiteCtrl', [
      '$scope',
      '$state',
      '$firebaseArray',
      '$firebaseObject',
      'FFService',
      '$firebaseAuth',
      'ngDialog',
      '$http',
      'Lang',
      function($scope, $state, $firebaseArray, $firebaseObject, FF, $firebaseAuth, ngDialog, $http, Lang) {

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

        $scope.filtered = {};

        $scope.filterProject = function(key, val) {
          $scope.filtered[key] = val;
        };

        var projects = firebase.database().ref().child('projects');
        $scope.projects = $firebaseArray(projects);

        $scope.ghData = {};

        $scope.totalCommits = function(project) {
          var total;
          if($scope.ghData[project.$id])
            total = $scope.ghData[project.$id].totalCommits;
          return total;
        }

        $scope.projects.$loaded().then(function(projects) {
          projects.forEach(function(project) {
            if(project.github) {
              $scope.ghData[project.$id] = {};
              $http.get('https://api.github.com/repos/'+ project.github + '/stats/commit_activity').then(function(data) {
                $scope.ghData[project.$id].commitActivity = data.data;
                $scope.ghData[project.$id].totalCommits = 0;
                data.data.forEach(function(week) {
                  $scope.ghData[project.$id].totalCommits += week.total;
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

        $scope.about.$loaded().then(function() {
          angular.element('body').css({opacity:1});
        });

        $scope.settings = function() {
          var translatableFields = ['title', 'tagline', 'description'];
          $scope.about.$loaded().then(function(about) {
            about.$translatedKeys = [];
            for(var key in about) {
              if(translatableFields.indexOf(key) != -1) {
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
          if(about.$translatedKeys && about.$translatedKeys.length) {
            about.$translatedKeys.forEach(function(key) {
              about[key] = langJoin(about[key]);
            });
          }
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
          if(typeof project.$save !== 'function') {
            var project = firebase.database().ref().child('projects').child(project.$id);;
            $scope.project = $firebaseObject(project);
          } else {
            $scope.project = project;
          }
          $scope.project.$loaded().then(function(project) {
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

        $scope.saveProject = function(project) {
          projectTranslatableFields.forEach(function(key) {
            if(project[key])
              project[key] = langJoin(project[key]);
          });
          if(project.$id) {
            project.$save().then(function() {
              $scope.editDialog.close();
              $scope.editDialog = null;
            });
          } else {
            $scope.projects.$add(project).then(function() {
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

        $scope.project.$loaded().then(function(project) {
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
