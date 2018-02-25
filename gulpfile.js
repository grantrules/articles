var gulp = require('gulp')
var handlebars = require('gulp-handlebars')
var markdown = require('gulp-markdown-it')
var del = require('del')
var frontMatter = require('gulp-front-matter')
var through = require('through2')
var Handlebars = require('handlebars')

var paths = {
    articles: ['*.md', '*.mdi'],
    templates: 'assets/templates/**/*.hb',
    images: 'assets/images/**/*'
}

var indexList = [];

var templates = {}

gulp.task('clean', function() {
    indexList = []
    templates = {}
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
    gulp.watch([paths.articles, paths.templates], ['site'])
    gulp.watch(paths.images, ['images'])
})



gulp.task('templates', function() {
    return gulp.src(paths.templates)
        .pipe(setTemplates())

})

gulp.task('articles', ['clean', 'templates'], function() {
    return gulp.src(paths.articles)
        .pipe(frontMatter({remove:true, property: 'frontMatter'}))
        .pipe(markdown({options: {html: true, typographer: true, linkify: true}, plugins: ["markdown-it-emoji", "markdown-it-table-of-contents"]}))
        .pipe(index())
        .pipe(compileArticle())
        .pipe(gulp.dest('build'))
})

gulp.task('site', ['articles'], function() {
//
})
  
gulp.task('default', [/*'watch',*/ 'site', 'images'])

/* load frontmatter into file.frontMatter
   and convert markdown to html */
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
        var template = (meta && meta.template) || 'article'
        var content = templates[`${template}.hb`]({body: body, ...meta});
        
        file.contents = new Buffer(content);
        
    
        cb(null, file);
    
      });
}

/* compile template and store it in object */
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

/* create index list of articles */
var index = (data, opts) => {
    return through.obj(function(file, enc, cb) {
        if (file.relative === 'index.html') {            
            file.frontMatter = {...file.frontMatter, indexList}
        } else {
            indexList.push({...file.frontMatter, url: file.relative})   
        }
        cb(null, file)
    });
}