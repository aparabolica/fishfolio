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
