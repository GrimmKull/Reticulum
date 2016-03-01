var gulp = require('gulp');
var concat = require('gulp-concat');

gulp.task('node', function() {
	return gulp.src([
			'../client/utils.js',
			'../client/auth.js',
			'../client/parser.js',
			'../client/media_node.js',
			'../client/transport.js',
			'../client/sip.js',
			'../client/ua.js',
			'../client/rtculum.js'
		])
		.pipe(concat("reticulum_node_phone.js"))
		.pipe(gulp.dest('build'));
});

gulp.task('default', function() {
	return gulp.src([
			'../client/utils.js',
			'../client/auth.js',
			'../client/parser.js',
			'../client/media2.js',
			'../client/transport.js',
			'../client/sip.js',
			'../client/ua.js',
			'../client/rtculum.js'
		])
		.pipe(concat("reticulum_phone.js"))
		.pipe(gulp.dest('build'));
});