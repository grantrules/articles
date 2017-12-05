var gulp = require('gulp')
var handlebars = require('gulp-handlebars')
var markdown = require('gulp-markdown')
var del = require('del')
var frontMatter = require('gulp-front-matter')
var through = require('through2')
var Handlebars = require('handlebars')




var paths = {
    articles: '*.md',
    templates: 'assets/templates/**/*.hb',
    images: 'assets/images/**/*'
}

var templates = {}

gulp.task('clean', function() {
    return del(['build'])
})


// Copy all static images
gulp.task('images', ['clean'], function() {
    return gulp.src(paths.images)
        //.pipe(imagemin({optimizationLevel: 5}))
        .pipe(gulp.dest('build/img'))
})


// Rerun the task when a file changes
gulp.task('watch', function() {
    gulp.watch(paths.articles, ['articles'])
    gulp.watch(paths.images, ['images'])
})



gulp.task('templates', function() {
    return gulp.src(paths.templates)
        .pipe(setTemplates())

})

gulp.task('articles', ['clean', 'templates'], function() {
    return gulp.src(paths.articles)
        .pipe(frontMatter({remove:true, property: 'frontMatter'}))
        .pipe(markdown())
        .pipe(compileArticle())
        .pipe(gulp.dest('build'))
})
  
gulp.task('default', ['watch', 'articles', 'images'])

var compileArticle = (data, opts) => {

    return through.obj(function(file, enc, cb) {
        if (file.isNull()) {
          return cb(null, file);
        }
        if (file.isStream()) {
          return cb()
        }

        var body = file.contents.toString();
        var meta = file.frontMatter;
        var content = templates['index.hb']({body: body, ...meta});
        
        file.contents = new Buffer(content);
        
    
        cb(null, file);
    
      });
}

var setTemplates = (data, opts) => {

    return through.obj(function(file, enc, cb) {
        if (file.isNull()) {
            return cb(null, file)
        }
        if (file.isStream()) {
            return cb()
        }

        var contents = file.contents.toString();
        var template = Handlebars.compile(contents, {noEscape: true})
        templates[file.relative] = template
    
        cb(null, file)
    
      });
}