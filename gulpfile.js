var gulp = require('gulp')
var sass = require('gulp-sass')
var coffee = require('gulp-coffee')
var concat = require('gulp-concat')
var order = require('gulp-order')
var spawn = require('child_process').spawn
var node;


gulp.task('sass', () => {
	return gulp.src('./src/sass/**/*.scss')
		.pipe(sass())
		.pipe(gulp.dest('./public/css'))
})




gulp.task('coffee', () => {
	return gulp.src('./src/coffeescript/**/*.coffee')
		.pipe(coffee({bare: true}))
		.pipe(order([
			'src/coffeescript/helpers.js',
			'src/coffeescript/**/*.js'
		]))
		.pipe(concat('app.js'))
		.pipe(gulp.dest('./public/js'))
})


gulp.task('config', () => {
	return gulp.src('./config.js').pipe(gulp.dest('./public/js'));
})

gulp.task('server', function() {
  gulp.run('sass')
  gulp.run('config')
  gulp.run('coffee')
  if (node) node.kill()
  node = spawn('node', ['app/server.js'], {stdio: 'inherit'})
  node.on('close', function (code) {
    if (code === 8) {
      gulp.log('Error detected, waiting for changes...');
    }
  });
})





gulp.task('default', () => {
	gulp.run('server')
	gulp.watch(
		[
			'./app/**/*.js',
			'./gulpfile.js',
			'./config.js',
			'./src/coffeescript/**/*.coffee', 
			'./src/sass/**/*.scss', 
			'./public', 
			'./src/templates/**/*.pug',
			'./package.json'
		], 
		function() {
			gulp.run('server')
		})
})



// clean up if an error goes unhandled.
process.on('exit', function() {
    if (node) node.kill()
})






