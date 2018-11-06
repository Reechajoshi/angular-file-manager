var gulp   = require('gulp'),
    jshint = require('gulp-jshint');
    sourcemaps = require('gulp-sourcemaps');
    concat = require('gulp-concat');
    gutil = require('gulp-util');
    uglify = require('gulp-uglify');
// define the default task and add the watch task to it
gulp.task('default', ['watch','build-js']);

// configure the jshint task
gulp.task('jshint', function() {
  return gulp.src('app/js/**/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
});

// configure which files to watch and what tasks to use on file changes
gulp.task('watch', function() {
  gulp.watch('app/js/**/*.js', ['jshint']);
});


gulp.task('build-js', function() {
  return gulp.src('app/js/**/*.js')
    .pipe(sourcemaps.init())
      .pipe(concat('bootswatch.min.js'))
      //only uglify if gulp is ran with '--type production'
      .pipe(gutil.env.type === 'production' ? uglify() : gutil.noop()) 
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('dist'));
});