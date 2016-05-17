var gulp = require('gulp');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');

gulp.task('node', function() {
	return gulp.src([
			'../client/null_ui.js',
			'../client/utils.js',
			'../client/auth.js',
			'../client/parser.js',
			'../client/null_media.js',
			'../client/transport.js',
			'../client/sip.js',
			'../client/ua.js',
			'../client/rtculum.js'
		])
		.pipe(concat("reticulum_node_phone.js"))
		.pipe(gulp.dest('build'))
		.pipe(rename('reticulum_node_phone.min.js'))
        .pipe(uglify())
		.pipe(gulp.dest('build'));
});

gulp.task('default', function() {
	return gulp.src([
			'../client/ui.js',
			'../client/utils.js',
			'../client/auth.js',
			'../client/parser.js',
			'../client/media.js',
			'../client/transport.js',
			'../client/sip.js',
			'../client/ua.js',
			'../client/rtculum.js'
		])
		.pipe(concat("reticulum_phone.js"))
		.pipe(gulp.dest('build'));
});
