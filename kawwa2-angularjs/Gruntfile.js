// Generated on 2013-07-29 using generator-angular 0.3.1
'use strict';
var LIVERELOAD_PORT = 35729;
var lrSnippet = require('connect-livereload')({ port: LIVERELOAD_PORT });
var mountFolder = function (connect, dir) {
  return connect.static(require('path').resolve(dir));
};

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to recursively match all subfolders:
// 'test/spec/**/*.js'

module.exports = function (grunt) {
  // load all grunt tasks
  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

  // configurable paths
  var yeomanConfig = {
    app: 'app',
    dist: 'dist',
    demo: 'demo',
    doc: 'docs'
  };

  try {
    yeomanConfig.app = require('./bower.json').appPath || yeomanConfig.app;
  } catch (e) {}

  grunt.initConfig({
    yeoman: yeomanConfig,
    watch: {
      coffee: {
      files: ['<%= yeoman.app %>/scripts/{,*/}*.coffee'],
      tasks: ['coffee:dist']
    },
    coffeeTest: {
    files: ['test/spec/{,*/}*.coffee'],
    tasks: ['coffee:test']
  },
  livereload: {
    options: {
      livereload: LIVERELOAD_PORT
    },
    files: [
  '<%= yeoman.app %>/{,*/}*.html',
'{.tmp,<%= yeoman.app %>}/styles/{,*/}*.css',
' {.tmp,<%= yeoman.app %>}/scripts/{,*/}*.js',
'<%= yeoman.app %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}'
]
}
},
connect: {
  options: {
    port: 9000,

        // Change this to '0.0.0.0' to access the server from outside.
        hostname: 'localhost'
      },
      livereload: {
        options: {
          middleware: function (connect) {
            return [
            lrSnippet,
            mountFolder(connect, '.tmp'),
            mountFolder(connect, yeomanConfig.app)
            ];
          }
        }
      },
      test: {
        options: {
          middleware: function (connect) {
            return [
            mountFolder(connect, '.tmp'),
            mountFolder(connect, 'test')
            ];
          }
        }
      },
      dist: {
        options: {
          middleware: function (connect) {
            return [
            mountFolder(connect, yeomanConfig.dist)
            ];
          }
        }
      },
      doc: {
          options: {
              port:8000,
              base:'docs'
          }
      }
    },
    open: {
      server: {
        url: 'http://localhost:<%= connect.options.port %>'
      },
      doc:{
          url: 'http://localhost:<%= connect.doc.options.port %>'
      }
    },
    clean: {
      dist: {
        files: [{
          dot: true,
          src: [
          '.tmp',
          '<%= yeoman.dist %>/*',
          '!<%= yeoman.dist %>/.git*'
          ]
        }]
      },

      server: '.tmp'
      ,
      demo:{
        files: [{
          dot: true,
          src: [
          '<%= yeoman.demo %>/app/lib/kawwa/directives/*',
          '<%= yeoman.demo %>/app/theme/*',
          '<%= yeoman.demo %>/app/img/*',
          '<%= yeoman.demo %>/app/views/*',
          '<%= yeoman.demo %>/app/scripts/controllers/*'
          ]
        }]
      },
      doc:{
        files: [{
          dot: true,
          src: [
            'docs/**/*',
            'docs/*'
          ]
        }]
      }
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      all: [
      'Gruntfile.js',
    '<%= yeoman.app %>/scripts/{,*/}*.js'
    ]
  },
  coffee: {
    dist: {
      files: [{
        expand: true,
        cwd: '<%= yeoman.app %>/scripts',
      src: '{,*/}*.coffee',
      dest: '.tmp/scripts',
      ext: '.js'
    }]
  },
  test: {
    files: [{
      expand: true,
      cwd: 'test/spec',
    src: '{,*/}*.coffee',
    dest: '.tmp/spec',
    ext: '.js'
  }]
}
},
concat: {
  options: {
    separator: ';'
  },
  only: {
    src: [ '<%= yeoman.app %>/scripts/kawwa.js',
    '<%= yeoman.app %>/scripts/directives/*.js'],
    dest: '<%= yeoman.dist %>/kawwa-directives-only.js'
  },
  full: {
    src: ['<%= yeoman.app %>/scripts/kawwa.js',
    '<%= yeoman.app %>/lib/jquery-ui/*',
    '<%= yeoman.app %>/plugins/*.js',
    '<%= yeoman.app %>/scripts/directives/*.js'],
    dest: '<%= yeoman.dist %>/kawwa-directives-full.js'
  }

},
rev: {
  dist: {
    files: {
      src: [
    '<%= yeoman.dist %>/scripts/{,*/}*.js'
    ]
  }
}
},
    // Put files not handled in other tasks here
    copy: {
      basic: {
        files: [{
          expand: true,
          dot: true,
          cwd: '<%= yeoman.app %>/scripts',
          dest: '<%= yeoman.dist %>',
          src: [
          'directives/**/*'

          ]
        }]
      },
      plugin: {
        files: [{
          expand: true,
          dot: true,
          cwd: '<%= yeoman.app %>',
          dest: '<%= yeoman.dist %>',
          src: [
          'plugins/*'
          ]
        }]
      },

      themeDemo:{
        files: [{
          expand: true,
          dot: true,
          cwd: '<%= yeoman.app %>/theme',
          dest: '<%= yeoman.demo %>/app/theme',
          src: [
          '*','**/*'
          ]
        }]
      },
      directivesDemo:{
        files: [{
          expand: true,
          dot: true,
          cwd: '<%= yeoman.dist %>',
          dest: '<%= yeoman.demo %>/app/lib/kawwa/scripts/',
          src: [
          '*','**/*'
          ]
        }]
      },
      imagesDemo:{
        files: [{
          expand: true,
          dot: true,
          cwd: '<%= yeoman.app %>',
          dest: '<%= yeoman.demo %>/app',
          src: [
          'img/*','img/**/*'
          ]
        }]
      },
      ctrlDemo:{
       files: [{
        expand: true,
        dot: true,
        process:function(src){
          return  src.replace("angular.module('kawwa2'","angular.module('demoApp'");
        },
        cwd: '<%= yeoman.app %>',
        dest: '<%= yeoman.demo %>/app',
        src: [
        'views/*',
        'scripts/controllers/*'
        ]
      }]
    },
    declaremodule: {
      files: [{
        expand: true,
        dot: true,
        process:function(src){
          return "try{\nangular.module(\"kawwa2\");   \n}catch(err){\nangular.module('kawwa2',[]);\n}\n"
          + '\n' + src.replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, '$1');
        },
        cwd: '<%= yeoman.dist %>',
        dest: '<%= yeoman.dist %>',
        src: [
        '/app/lib/kawwa/scripts/directives'
        ]
      }]
    },
    imageDoc:{
        files: [{
            expand: true,
            dot: true,
            cwd: '<%= yeoman.app %>',
            dest: '<%= yeoman.doc %>',
            src: [
                'img/*','img/**/*'
            ]
        }]
    },
    imageThemeDoc:{
        files: [{
            expand: true,
            dot: true,
            cwd: '<%= yeoman.app %>/theme/img',

            dest: '<%= yeoman.doc %>/img',
            src: [
                '*','**/*'
            ]
        }]
    }

  },
  karma: {
    unit: {
      configFile: 'karma.conf.js',
      singleRun: true
    },
    e2e: {
      configFile: 'karma-e2e.conf.js',
      singleRun: true
    },
    midway: {
      configFile: 'karma-midway.conf.js',
      autoWatch: false,
      singleRun: true
    }
  },
  ngmin: {
    dist: {
      files: [{
        expand: true,
        cwd: '<%= yeoman.dist %>',
        src: '*.js',
        dest: '<%= yeoman.dist %>'
      }]
    }
  },
  uglify: {
    only: {
      files: {
        '<%= yeoman.dist %>/kawwa-directives-only.min.js': [
        '<%= yeoman.dist %>/kawwa-directives-only.js'
        ]
      }
    },
    full: {
      files: {
        '<%= yeoman.dist %>/kawwa-directives-full.min.js': [
        '<%= yeoman.dist %>/kawwa-directives-full.js'
        ]
      }
    }
  },
  zip: {
    'kawwa-release.zip':['<%= yeoman.dist %>/*','<%= yeoman.dist %>/**/*']
  },
  ngdocs: {
    options:{
      scripts:['<%= yeoman.app %>/lib/jquery/jquery-1.8.3.js',
          '<%= yeoman.app %>/components/angular/angular.js',
          '<%= yeoman.app %>/lib/jquery-ui/jquery.ui.core.js',
          '<%= yeoman.app %>/lib/jquery-ui/jquery.ui.widget.js',
          '<%= yeoman.dist %>/kawwa-directives-full.js'
      ],
      styles:['<%= yeoman.app %>/theme/css/k-theme0.css',
              'util/reset.css'
      ],
      dest:'docs',
      html5Mode:true
    },
    api:{
      src:['app/scripts/directives/*.js'],
      title: 'API Documentation'
    }
  },
  replace:{
    doc:{
        src:['<%= yeoman.doc %>/index.html'],
        overwrite:true,
        replacements:[{
            from: "addTag('link', {rel: 'stylesheet', href: 'css/reset.css', type: 'text/css'}, sync);",
            to: function(matchedWord){
                return matchedWord + '\n' +  '\t\t\t' +
                    "addTag('link', {rel: 'stylesheet', href: 'css/bootstrap.min.css', type: 'text/css'});"
            }
        }]
    }
  }

  
});

grunt.registerTask('server', function (target) {
  if (target === 'dist') {
    return grunt.task.run(['build', 'open:server', 'connect:dist:keepalive']);
  }

  grunt.task.run([
    'clean:server',
   // 'concurrent:server',
   'connect:livereload',
   'open:server',
   'watch'
   ]);
});

grunt.registerTask('test:unit', [
  'clean:server',
  'connect:test',
  'karma:unit'
  ]);

grunt.registerTask('test:e2e', [
  'clean:server',
    //'livereload-start',
    'connect:livereload',
    'karma:e2e'
    ]);

grunt.registerTask('test:midway', [
  'clean:server',
  'connect:test',
  'karma:midway'
  ]);

grunt.registerTask('demo', [
    'clean:demo',
    'copy:ctrlDemo',  //copy kawwa to the demo
    'copy:themeDemo', //copy the theme to the demo
    'copy:directivesDemo',//copy the directive directory to the demo
    'copy:imagesDemo'
]);


grunt.registerTask('build', [
  'clean:dist',  //clean kawwa
  'concat',      //concat the directives with the plugins
  'copy:basic',  //copy kawwa  to dist
  'copy:plugin', //copy the plugins to dist
  'ngmin',
  'uglify',
  //'rev',
  'copy:declaremodule'
  ]);

grunt.registerTask('doc', [

    'clean:doc',
    'ngdocs',
    'copy:imageDoc',
    'copy:imageThemeDoc',
    'replace',
    'open:doc',
    'connect:doc:keepalive'

]);


grunt.registerTask('release', [
    'clean:doc',
    'build',
    'demo',
    'zip',
    'doc'
    ]);
grunt.registerTask('default', [

  'test:unit',
    //'test:e2e',
    //'test:midway',
    'build'
    ]);
};