var gulp = require("gulp")
	,sass = require('gulp-sass')
	,cssmin = require('gulp-cssmin')
	,concat = require("gulp-concat")
	,plumber = require("gulp-plumber")
	,browserSync = require('browser-sync').create();

var config = {
	src : "./src/**/",
	output : "./out/"
}
gulp.task('serve',['html','sass','image','js'],function() {
	browserSync.init({
		server: {
			"baseDir":"./out/"
		}
	});
	//js
	gulp.watch(config.src+'js/*',['js']).on('change', browserSync.reload);
	//sass
	gulp.watch([config.src+'*/*.scss'],['sass']);
	//images
	gulp.watch(config.src+'images/*',['image']).on('change', browserSync.reload);
	//html
	gulp.watch([config.src+'*.html'],['html']).on('change', browserSync.reload);
});
gulp.task('sass', function () {
	return gulp.src(config.src+'css/*.scss')
		.pipe(plumber({
			errorHandler: function(err) {
				console.log(err.messageFormatted);
				this.emit('end');
			}
		}))
		.pipe(sass())
		.pipe(cssmin())
		.pipe(browserSync.stream())
		.pipe(gulp.dest(config.output));
});
gulp.task('html',function(){
	return gulp.src(config.src+'/*.html')
		.pipe(gulp.dest(config.output))
});
gulp.task('image',function(){
	return gulp.src(config.src+'images/*')
		.pipe(gulp.dest(config.output))
});
gulp.task('js',function(){
	return gulp.src(config.src+'js/*')
		.pipe(gulp.dest(config.output))
});