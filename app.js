!function a(b,c,d){function e(g,h){if(!c[g]){if(!b[g]){var i="function"==typeof require&&require;if(!h&&i)return i(g,!0);if(f)return f(g,!0);var j=new Error("Cannot find module '"+g+"'");throw j.code="MODULE_NOT_FOUND",j}var k=c[g]={exports:{}};b[g][0].call(k.exports,function(a){var c=b[g][1][a];return e(c?c:a)},k,k.exports,a,b,c,d)}return c[g].exports}for(var f="function"==typeof require&&require,g=0;g<d.length;g++)e(d[g]);return e}({1:[function(a,b,c){!function(a,b,c,d){var e=a.module("mp",["ui.router","firebase"]);e.value("api","https://miguelpeixe.firebaseio.com/"),e.config(["$stateProvider","$urlRouterProvider","$locationProvider","$httpProvider",function(a,b,c,d){c.html5Mode({enabled:!1,requireBase:!1}),c.hashPrefix("!"),a.state("home",{url:""}).state("project",{url:"/projects/:id",controller:"ProjectCtrl",templateUrl:"views/project.html"})}]),e.controller("SiteCtrl",["$scope","api","$firebaseArray","$firebaseObject",function(a,b,c,d){var e=new Firebase(b+"projects");a.projects=c(e);var f=new Firebase(b+"about");a.about=d(f)}]),e.controller("ProjectCtrl",["$scope","$stateParams","api","$firebaseObject",function(a,b,c,d){var e=new Firebase(c+"projects/"+b.id);a.project=d(e)}]),e.directive("fullWidth",[function(){return{restrict:"EA",scope:{offset:"=",fixHeight:"="},link:function(a,c,d){a.offset=a.offset||0,b(window).on("resize",function(){var d=b(c).offset(),e=b(window).width();b(c).css({width:e-d.left-a.offset,display:"block"}),a.fixHeight&&b(c).height(b(c).find("> *").height())}),b(window).resize()}}}]),e.directive("webDevice",["$sce",function(a){return{restrict:"E",scope:{src:"=",width:"=",height:"="},transclude:!0,replace:!0,template:'<div class="web-device-container"><div class="web-device-content"><iframe ng-src="{{url}}" frameborder="0"></iframe></div><ng-transclude></ng-transclude</div>',link:function(c,d,e){c.$watch("src",function(b){c.url=a.trustAsResourceUrl(c.src)}),b(window).on("resize",function(){var a=b(d).parent().width(),e=a/c.width;b(d).css({width:c.width*e,height:c.height*e});var f=b(d).find(".web-device-content").width()/c.width;b(d).find("iframe").css({width:c.width,height:c.height,"transform-origin":"top left",transform:"scale("+f+")",transition:"all .2s linear"})}),b(window).resize()}}}]),a.element(document).ready(function(){a.bootstrap(document,["mp"])})}(window.angular,window.jQuery,window._)},{}]},{},[1]);