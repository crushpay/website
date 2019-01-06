require('dotenv').config()
const gulp = require('gulp')
const browserSync = require('browser-sync')
const uglify = require('gulp-uglify')
const cleancss = require('gulp-clean-css')
const imagemin = require('gulp-imagemin')
const cache = require('gulp-cache')
const del = require('del')
const runSequence = require('run-sequence').use(gulp)
const autoprefixer = require('gulp-autoprefixer')
const revall = require('gulp-rev-all')
const awspublish = require('gulp-awspublish')
const through = require('through2')
const Cloudfront = require('aws-sdk/clients/cloudfront')
const prompt = require('prompt')
const pump = require('pump')


const credentials = {
  'key': process.env.AWS_SECRET_ACCESS_KEY,
  'secret': process.env.AWS_SECRET_ACCESS_KEY,
  'bucket': process.env.AWS_BUCKET,
  'region': process.env.AWS_REGION || 'ap-northeast-2',
  'distributionId': process.env.AWS_DISTRO_ID
}

const publisher = awspublish.create({
  region: credentials.region,
  params: {
    Bucket: credentials.bucket
  }
}, {
  cacheFileName: 'cloudfront-cache'
})

const headers = {'Cache-Control': 'max-age=315360000, no-transform, public'}

// aws cloudfront update-distribution --id <id> --default-root-object <filename>
const cloudfront = new Cloudfront()

// need to update the index.html ( Default Root Object) include version tag
function updateCloudfrontRootObject (file) {
  let params = {Id: process.env.AWS_DISTRO_ID}
  cloudfront.getDistributionConfig(params, (err, data) => {
    if (err) {
      console.log(err)
    } else {
      let distConfig = data.DistributionConfig
      params.IfMatch = data.ETag
      distConfig.DefaultRootObject = file
      params.DistributionConfig = distConfig
      cloudfront.updateDistribution(params, (err, result) => {
        if (err) {
          console.log(err)
        } else {
          console.log('Cloudfront Default Root Object updated Successfully.')
        }
      })
    }
  })
}

gulp.task('publish', function () {
  gulp.src('dist/**')
    .pipe(revall.revision())

    // go through files and updated the index.html file with a tag
    .pipe(through.obj(function (chunk, enc, cb) {
      let path = chunk.path
      let array = path.split('/')
      let re = /(?:index|html)/
      array.forEach(e => {
        if (re.test(e)) {
          console.log(e)
          updateCloudfrontRootObject(e)
        }
      })
      cb(null, chunk)
    }))
    .pipe(awspublish.gzip())
    .pipe(publisher.publish(headers))
    .pipe(publisher.cache())
    .pipe(awspublish.reporter())
})

gulp.task('browserSync', function () {
  browserSync.init({
    server: {
      baseDir: 'src'
    },
    notify: false
  })
})

gulp.task('css', function () {
  return gulp.src('src/css/**.css')
    .pipe(autoprefixer())
    .pipe(cleancss())
    .pipe(gulp.dest('dist/css'))
    .pipe(browserSync.reload({
      stream: true
    }))
})

gulp.task('watch', function () {
  gulp.watch('src/css/*.css', browserSync.reload)
  gulp.watch('src/*.html', browserSync.reload)
  gulp.watch('src/js/**/*.js', browserSync.reload)
})

gulp.task('imagemin', function () {
  return gulp.src('src/images/**/*.+(png|jpg|gif|swg|svg)')
    .pipe(cache(imagemin({
      gif: {
        interlaced: true
      }
    })))
    .pipe(gulp.dest('dist/images'))
})

gulp.task('fonts', function () {
  return gulp.src('src/fonts/**/*')
    .pipe(gulp.dest('dist/fonts'))
})

gulp.task('images', function () {
  return gulp.src('src/images/**/*')
    .pipe(gulp.dest('dist/images'))
})

gulp.task('favicon', function () {
  return gulp.src('src/favicon.ico')
    .pipe(gulp.dest('dist/'))
})
gulp.task('js', function (cb) {
  pump([
    gulp.src('src/js/**/*.js'),
        uglify(),
        gulp.dest('dist/js')
    ],
    cb
  );
})

gulp.task('index', function () {
  return gulp.src('src/index.html')
    .pipe(gulp.dest('dist/'))
})

gulp.task('pages', function () {
  return gulp.src('pages/**/*')
    .pipe(gulp.dest('dist/pages'))
})

gulp.task('docs', function () {
  return gulp.src('docs/**/*')
    .pipe(gulp.dest('dist/docs'))
})

gulp.task('clean:dist', function () {
  return del.sync(['dist/**/*', '!dist/images', '!dist/images/**/*'])
})

gulp.task('default', function (callback) {
  runSequence(['css', 'browserSync', 'watch'],
    callback
  )
})

gulp.task('check', function(callback) {
  prompt.start()
  prompt.get([
    {
      name: 'agree',
      required: true,
      description: `Do you want to deploy '${process.env.ENVIRONMENT_STAGE}'?: (y/n)`
    }], (err, result) => {
      if (result.agree === 'y') {
        callback()
      } else {
        process.exit()
      }
  })
})

gulp.task('build', function (callback) {
  runSequence('clean:dist', ['css', 'js', 'favicon', 'index', 'images', 'imagemin', 'fonts'], callback)
})

gulp.task('deploy', function (callback) {
  runSequence('build', ['publish'], callback)
})
