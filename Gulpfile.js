/**
 * Gulpfile.js
 *
 * @author Villem Alango <villem.alango@gmail.com>
 * @created 06.07.15
 */

(function () {

  'use strict';

  //  Directories we want to process ... jshint or otherwise
  var SOURCES = ['.'];
  //  Stuff we don't want to touch
  var IGNORE = ['node_modules', 'coverage'];
  //  jshint options file name
  var HINTRC = '.jshintrc';

  var gulp    = require('gulp')
    , path    = require('path')
    , ignorer = require('gulp-ignore')
    , jshint  = require('gulp-jshint')
    , stylish = require('jshint-stylish')
      /* globals console: false  */
    , log     = console.log.bind(console, '#')
    ;
  var sep        = path.sep
    , basePath   = __dirname
    , allJs      = ['**', '*.js'].join(sep)
    , ruleLength = HINTRC.length
    , sources, rules, excludes
    ;

  /**
   * Create an array of absolute paths combined with filename
   * @param {Array<string>} directories
   * @param {string} filename
   * @returns {Array<string>}
   */
  var compose = function (directories, filename) {
    return directories.map(function (p) {
      var r = [basePath, p];

      /\.js$/.test(p) || r.push(filename);
      r = path.normalize(r.join(sep));
      return r;
    });
  };

  //  Initialize the paths
  sources = compose(SOURCES, allJs);
  rules = compose(SOURCES, '**' + sep + HINTRC);
  excludes = compose(IGNORE, allJs);

// JSHINT
// @link(https://www.npmjs.com/package/gulp-jshint)
// @link(http://jshint.com/docs/)
// NB: unless `lookup` option is set to false,
// linter will search for ".jshintrc" in the file's directory and then
// climb upwards.

  function hinter(fspec, opt_options) {
    return gulp.src(fspec)
      .pipe(ignorer.exclude(excludes))
      .pipe(jshint(opt_options))
      .pipe(jshint.reporter(stylish));
  }

  // ==================  Tasks  ===================

  /*
   Watch for source file changes.
   NB: this does not detect new file creation!
   */
  gulp.task('watch', function () {
    gulp.watch(sources, function (ev) {
      if (ev.type !== 'deleted') {
        log('watch:', ev.path);
        hinter(ev.path);
      }
    });
  });

  /*
   When .jshintrc file is changed, run jshint for affected directories.
   */
  gulp.task('hint-watch', function () {
    gulp.watch(rules, function (ev) {
      var p = ev.path;
      p = p.substr(0, p.length - ruleLength) + allJs;
      hinter(p);
    });
  });

  /*
   Run-once jshint task.
   */
  gulp.task('hint', function () {
    hinter(sources);
  });

  /*
   todo: fix it or remove it.
   */
  //gulp.task('test', function () {
  //  return gulp.src('tests/**/*Spec.js')
  //    .pipe(jasmine());
  //});

  // Define the default task as a sequence of the above tasks
  gulp.task('default', ['hint', 'watch', 'hint-watch']);

}());
