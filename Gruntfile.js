var fs = require('fs');

module.exports = function(grunt) {

  var config = require('./config');

  if(config.cname) {
    fs.writeFile('./dist/CNAME', config.cname);
  }

  grunt.initConfig({
    ngconstant: {
      dist: {
        options: {
          name: 'fishfolio.config',
          dest: 'dist/config.js',
          constants: config
        }
      }
    },
    browserify: {
      all: {
        files: {
          'dist/app.js': 'src/js/index.js'
        }
      }
    },
    uglify: {
      all: {
        options: {
          mangle: true,
          compress: true
        },
        files: {
          'dist/app.js': 'dist/app.js',
        }
      }
    },
    less: {
      all: {
        options: {
          compress: true
        },
        files: {
          'dist/css/app.css': 'src/css/main.less'
        }
      }
    },
    jade: {
      all: {
        options: {
          data: function(dest, src) {
            return {config: config};
          },
          doctype: 'html',
          pretty: false
        },
        files: [{
          expand: true,
          cwd: 'src',
          src: ['**/*.jade', '!views/includes/**/*'],
          dest: 'dist',
          ext: '.html'
        }]
      }
    },
    nggettext_extract: {
      pot: {
        files: {
          'languages/template.pot': ['dist/**/*.html']
        }
      }
    },
    nggettext_compile: {
      all: {
        options: {
          module: 'fishfolio'
        },
        files: {
          'src/js/translations.js': ['languages/*.po']
        }
      }
    },
    copy: {
      all: {
        files: [
          {
            cwd: 'src',
            src: ['**', '!js/**', '!**/*.less', '!**/*.jade', '!**/*.js'],
            dest: 'dist',
            expand: true
          }
        ]
      },
      static: {
        files: [
          {
            cwd: 'bower_components',
            src: ['**/*'],
            dest: 'dist/static',
            expand: true
          }
        ]
      }
    },
    watch: {
      options: {
        livereload: true
      },
      css: {
        files: 'src/css/**/*.less',
        tasks: ['less']
      },
      jade: {
        files: 'src/**/*.jade',
        tasks: ['jade', 'nggettext_extract']
      },
      scripts: {
        files: 'src/js/**/*.js',
        tasks: ['browserify', 'nggettext_extract']
      },
      localize: {
        files: 'languages/*.po',
        tasks: ['nggettext_compile']
      },
      copy: {
        files: ['src/**', '!src/**/*.less', '!src/**/*.jade', '!src/**/*.js'],
        tasks: ['copy']
      }
    },
    'gh-pages': {
      options: {
        base: 'dist'
      },
      src: ['**']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-jade');
  grunt.loadNpmTasks('grunt-angular-gettext');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-ng-constant');
  grunt.loadNpmTasks('grunt-gh-pages');

  grunt.registerTask(
    'javascript',
    'Compile scripts.',
    ['ngconstant', 'nggettext_compile', 'browserify', 'uglify']
  );

  grunt.registerTask(
    'views',
    'Compile views.',
    ['jade', 'less', 'nggettext_extract']
  );

  grunt.registerTask(
    'build',
    'Compiles everything.',
    ['copy', 'javascript', 'views']
  );

  grunt.registerTask(
    'deploy',
    'Deploy to GitHub Pages',
    ['build', 'gh-pages']
  )

  grunt.registerTask(
    'default',
    'Build, start server and watch.',
    ['build', 'watch']
  );

}
