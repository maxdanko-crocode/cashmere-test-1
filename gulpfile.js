const gulp = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const filter = require('gulp-filter');

gulp.task('styles', () => {
    return gulp.src(['styles/*.scss', 'styles/sections/*.scss'])
        .pipe(filter(function (file) {
            return !/\/_/.test(file.path) || !/^_/.test(file.relative);
        }))
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('assets'));
});

gulp.task('watch', function () { 
    gulp.watch('styles/**/*.scss', gulp.series("styles"));
});