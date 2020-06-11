const gulp = require('gulp');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const cleanCSS = require('gulp-clean-css');
const terser = require('gulp-terser');
const browserSync = require('browser-sync').create();

function style() {
  return gulp.src('./sass/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(autoprefixer())
    .pipe(cleanCSS())
    .pipe(gulp.dest('./dist'))
    .pipe(browserSync.stream());
}

function minify() {
  return gulp.src('./js/*.js')
    .pipe(terser())
    .pipe(gulp.dest('./dist'));
}

function watch() {
  browserSync.init({
    server: {
      baseDir: './'
    },
    notify: false,
    open: false,
  });
  gulp.watch('./sass/styles.scss', style);
  gulp.watch('./js/*.js', minify);
  gulp.watch('./index.html').on('change', browserSync.reload);
}

exports.style = style;
exports.watch = watch;
exports.minify = minify;
