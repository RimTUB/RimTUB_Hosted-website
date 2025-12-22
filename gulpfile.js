"use strict";

// path

const appFolder = './app/';
const buildFolder = './dist/';

const path = {
  app: {
    html: [`${appFolder}*.html`, `!${appFolder}_*.html`, `!${appFolder}blocks/*.html`],
		pug: [`${appFolder}pug/pages/*.pug`, `!${appFolder}pug/pages/_*.pug`],
    css: `${appFolder}scss/main.scss`,
		js: [`${appFolder}js/main.js`, `!${appFolder}js/_*.js`],
		jslint: [`${appFolder}js/**/*.js`, `!${appFolder}js/libs/*.js`],
		img: `${appFolder}images/**/**.{jpg,jpeg,png}`,
		svg: [`${appFolder}images/**/*.svg`, `!${appFolder}images/sprite/`],
		svgsprite: `${appFolder}images/sprite/*.svg`,
		resource: `${appFolder}resources/**/*.*`,
		fonts: `${appFolder}fonts/*.*`
  },

  build: {
    html: buildFolder,
    css: `${buildFolder}css/`,
		js: `${buildFolder}js/`,
		img: `${buildFolder}images/`,
		resource: `${buildFolder}resources/`,
		fonts: `${buildFolder}fonts/`
  },

  watch: {
    html: `${appFolder}**/*.html`,
    pug: `${appFolder}pug/**/*.pug`,
    css: `${appFolder}scss/**/*.scss`,
		js: `${appFolder}js/**/*.js`,
		img: `${appFolder}images/**/*.{gif,webp,ico,avif,jpg,jpeg,png,svg}`,
		resource: `${appFolder}resources/**/*.*`
  },
  clean: buildFolder
}


// plugins

import { dest, parallel, series, src, watch } from 'gulp'

// html
import { sync } from 'glob'
import include from 'gulp-file-include'
import gulpHtmlBemValidator from 'gulp-html-bem-validator'
import htmlMin from 'gulp-htmlmin'
import prettyHtml from 'gulp-pretty-html'
import typograf from 'gulp-typograf'
import { w3cHtmlValidator } from 'w3c-html-validator'

// pug
import gulpPug from "gulp-pug"
import gulpPugLinter from "gulp-pug-linter"

// scss
import autoprefixer from 'gulp-autoprefixer'
import cleanCss from 'gulp-clean-css'
import cssBeautify from 'gulp-cssbeautify'
import postcss from 'gulp-postcss'
import gulpSass from 'gulp-sass'
import sourcemaps from 'gulp-sourcemaps'
import cssComments from 'gulp-strip-css-comments'
import sortMedia from 'postcss-combine-media-query'
import * as dartSass from 'sass'
const sass = gulpSass(dartSass);

// js
import eslint from 'gulp-eslint'
import uglify from "gulp-uglify-es"
import webpackStream from 'webpack-stream'

// images
import avif from 'gulp-avif'
import imageMin from 'gulp-imagemin'
import newer from 'gulp-newer'
import svgSprite from 'gulp-svg-sprite'
import svgMin from 'gulp-svgmin'
import webp from 'gulp-webp'
import img_to_picture from "gulp_img_transform_to_picture"

// cache
import cache from 'gulp-cache'

// fonts
import fonter from 'gulp-fonter-fix'
import woff2 from 'gulp-ttf2woff2'

// others
import browserSync from 'browser-sync'
import localtunnel from "localtunnel";
import chalk from 'chalk'
import { deleteAsync } from 'del'
import fs from 'fs'
import ghpage from "gh-pages"
import cheerio from 'gulp-cheerio'
import gulpIf from 'gulp-if'
import notify from 'gulp-notify'
import plumber from 'gulp-plumber'
import rename from 'gulp-rename'
import replace from 'gulp-replace'
import gulpZip from 'gulp-zip'
import pathRoot from 'path'

const rootFolder = pathRoot.basename(pathRoot.resolve());

// production
const isProd = process.argv.includes('--build');
const isPrev = process.argv.includes('--prev');

const jsonSettings = JSON.parse(fs.readFileSync('./config.json', 'utf8'))

const markupType = jsonSettings.markupType

if (markupType !== 'html' && markupType !== 'pug') {
  console.error(chalk.red.bold('markupType может быть только "html" или "pug"'))
	process.exit(1)
}

// function

export const clean = () => {
  return deleteAsync(path.clean)
};

export const cacheTask = () => {
  return cache.clearAll()
};

const config_pic = {
		extensions: {
			png: true,
			jpg: true,
			jpeg: true
		}
};

export const pug = () => {
  return src(path.app.pug)
    .pipe(plumber(notify.onError({
      title: "PUG",
      message: "Error: <%= error.message %>"
    })))
	.pipe(gulpPugLinter({reporter: 'default'}))
	// Поменяйте pretty на true, если хотите не минифицированный html
  .pipe(gulpPug({
    pretty: !isProd,
	  verbose: true
    }))
	.pipe(typograf({locale: ['ru', 'en-US']}))
	.pipe(gulpHtmlBemValidator())
	.pipe(replace(/#img\//g, 'images/'))
	.pipe(gulpIf(isProd, img_to_picture(config_pic)))
	// Удалите строку ниже, если не хотите, чтобы название файла было с суффиксом .min
	.pipe(gulpIf(isProd, rename({suffix: '.min'})))
  .pipe(dest(path.build.html))
  .pipe(browserSync.stream());
};

export const html = () => {
	if (markupType === 'pug') {
		return pug()
	}
	else {
		return src(path.app.html)
		.pipe(plumber(notify.onError({
			title: "HTML",
			message: "Error: <%= error.message %>"
		})))
		.pipe(include({
			prefix: '@',
			basepath: '@file'
		}))
		.pipe(typograf({locale: ['ru', 'en-US']}))
		.pipe(replace(/#img\//g, 'images/'))
		.pipe(gulpIf(isProd, img_to_picture(config_pic)))
		.pipe(prettyHtml({indent_size: 2}))
		// Закомментировать строку ниже, если требуется минифицированный и не минифицированный html
		.pipe(dest(path.build.html))
		.pipe(gulpHtmlBemValidator())
		.pipe(gulpIf(isProd, htmlMin({
			collapseWhitespace: true,
			removeComments: true
		})))
		.pipe(gulpIf(isProd, rename({suffix: '.min'})))
		.pipe(dest(path.build.html))
		.pipe(browserSync.stream())
	}
};

export const validateHTML = () => {
	if (!isProd) {
		const htmlFiles = sync('dist/*.html');

		htmlFiles.forEach(file => {
			const options = {
				filename: file
			}

			w3cHtmlValidator.validate(options)
				.then(w3cHtmlValidator.reporter)
				.catch(error => console.error(`Validation error in ${file}:`, error))
		})

		return Promise.resolve()
	} else {
		return Promise.resolve()
	}
};

export const scss = () => {
  return src(path.app.css)
  .pipe(plumber(notify.onError({
    title: "SCSS",
    message: "Error: <%= error.message %>",
  })))
	.pipe(gulpIf(!isProd, sourcemaps.init()))
  .pipe(sass({silenceDeprecations: ['legacy-js-api']}))
  .pipe(postcss([sortMedia({sort: 'desktop-first'})]))
  .pipe(autoprefixer({
    cascade: false,
    grid: true,
    overrideBrowserslist: ["last 5 versions"]
  }))
  .pipe(gulpIf(!isProd, cssBeautify({indent: '  '})))
  .pipe(gulpIf(isProd, cssComments()))
  .pipe(gulpIf(isProd, cleanCss({level: 2})))
	.pipe(replace(/#img\//g, '../images/'))
	.pipe(gulpIf(!isProd, sourcemaps.write()))
  .pipe(dest(path.build.css))
  .pipe(browserSync.stream())
};

export const js = () => {
	return src(path.app.js)
	.pipe(plumber(notify.onError({
    title: "JS",
    message: "Error: <%= error.message %>"
  })))
	.pipe(webpackStream({
		mode: isProd ? 'production' : 'development',
		output: {
			filename: 'main.js'
		},
		module: {
  		rules: [{
      	test: /\.(?:js|mjs|cjs)$/,
      	exclude: /node_modules/,
      	use: {
        	loader: 'babel-loader',
        	options: {
          	presets: [['@babel/preset-env', { targets: "defaults" }]
  ]}}},
	{
		test: /\.css$/i,
		use: ['style-loader', 'css-loader'],
	}
	]},
	devtool: !isProd ? 'source-map' : false})).on('error', function (err) {console.error('WEBPACK ERROR', err);this.emit('end');})
	.pipe(gulpIf(isProd, uglify.default()))
	.pipe(dest(path.build.js))
	.pipe(browserSync.stream())
};

export const jslint = () => {
	return src(path.app.jslint)
		.pipe(eslint())
		.pipe(eslint.format('pretty'))
};

export const fonts = () => {
  return src(path.app.fonts, {encoding: false})
	.pipe(plumber(notify.onError({
    title: "FONTS",
    message: "Error: <%= error.message %>"
  })))
  .pipe(fonter({formats: ['ttf']}))
  .pipe(woff2())
  .pipe(dest(path.build.fonts))
};

export const autoconnectfont = () => {
	let appfonts = "./app/scss/_fonts.scss";
	let fontWeights = {
		thin: 100,
		hairline: 100,
		extralight: 200,
		ultralight: 200,
		light: 300,
		regular: 400,
		medium: 500,
		semibold: 600,
		demibold: 600,
		bold: 700,
		extrabold: 800,
		ultrabold: 800,
		black: 900,
		heavy: 900,
		extrablack: 950,
		ultrablack: 950,
	};
	let fontStyles = {
		italic: "italic",
		oblique: "oblique",
		normal: "normal",
	};

	fs.readdir(path.build.fonts, function (err, fontsFiles) {
		if (err) {
			console.error(err);
			return;
		}

		if (fs.existsSync(appfonts)) {
			console.log(
				`Файл ${appfonts} уже создан. Чтобы обновить файл необходимо его удалить!`
			);
			return;
		}

		let fileContent = "@use 'mixins' as *;\n\n";
		for (var i = 0; i < fontsFiles.length; i++) {
			let fontFileName = fontsFiles[i].split(".")[0];
			let fontName = fontFileName.split(/[-]/)[0];
			let normalizedString = fontFileName.toLowerCase();

			let weight = Object.keys(fontWeights).reduce(
				(acc, weight) =>
					normalizedString.includes(weight) ? fontWeights[weight] : acc,
				undefined
			);

			let style = Object.keys(fontStyles).reduce(
				(acc, style) =>
					normalizedString.includes(style) ? fontStyles[style] : acc,
				"normal"
			);

			fileContent += `@include font-face("${fontName}", "${fontFileName}", ${weight}, ${style});\r\n`;
		}

		fs.writeFile(appfonts, fileContent, (err) => {
			if (err) {
				console.error(err);
			} else {
				console.log(`Файл ${appfonts} обновлен`);
			}
		});
	});
	return src(appFolder)
};

export const sprites = () => {
	return src(path.app.svgsprite, { encoding: false })
	.pipe(plumber(notify.onError({
    title: "SPRITE",
    message: "Error: <%= error.message %>"
  })))
		.pipe(svgMin({
				js2svg: {
					pretty: true
		},}))
		.pipe(cheerio({
      run: function ($) {
				$('[fill]').removeAttr('fill');
				$('[stroke]').removeAttr('stroke');
				$('[style]').removeAttr('style');
        },
        parserOptions: {
          xmlMode: true
    },}))
		.pipe(replace("&gt;", ">"))
		.pipe(svgSprite({
				mode: {
					symbol: {
						sprite: "../sprite.svg"
		}}}))
		.pipe(dest(path.build.img))
		.pipe(browserSync.stream());
};

export const images = () => {
  const img = src([path.app.img, ...path.app.svg], { encoding: false })
	.pipe(plumber(notify.onError({
		title: "IMAGES",
		message: "Error: <%= error.message %>"
	})))

  if (isProd) {
    return img
			.pipe(newer(path.build.img))
			.pipe(imageMin({
				quality: 75,
				optimizationLevel: 3,
				svgoPlugins: [{ removeViewBox: false }],
				interlaced: true,
				progressive: true
			}))
			.pipe(dest(path.build.img))
			.pipe(src(path.app.img, {encoding: false}))
      .pipe(newer(path.build.img))
      .pipe(avif({ quality: 50 }))
      .pipe(dest(path.build.img))

      .pipe(src(path.app.img, {encoding: false}))
      .pipe(newer(path.build.img))
      .pipe(webp({ quality: 75 }))
      .pipe(dest(path.build.img))

  } else {
    return img
			.pipe(imageMin({
				quality: 75,
				optimizationLevel: 3,
				svgoPlugins: [{ removeViewBox: false }],
				interlaced: true,
				progressive: true,
				}))
			.pipe(dest(path.build.img));
  }
};

export const imagesCopy = () => {
	return src(`${appFolder}images/**/*.{gif,webp,ico,avif}`, { encoding: false })
  .pipe(plumber(notify.onError({
    title: "IMAGES COPY",
    message: "Error: <%= error.message %>"
  })))
	.pipe(dest(path.build.img))
};

export const resources = () => {
	return src(path.app.resource, {encoding: false})
	.pipe(plumber(notify.onError({
		title: "RESOURCES",
		message: "Error: <%= error.message %>"
	})))
	.pipe(dest(path.build.resource))
};

export const zip = () => {
	return src(`${buildFolder}/**/*.*`, { encoding: false })
	.pipe(plumber(notify.onError({
		title: "ZIP",
		message: "Error: <%= error.message %>"
	})))
	.pipe(gulpZip(`${rootFolder}.zip`))
	.pipe(dest('./'))
};

const localTunnelConfig = jsonSettings.localtunnel
export const watcher = () => {
  browserSync.init({server: {
      baseDir: buildFolder,
    },
    notify: false,
    port: 4040,
  }, async function(err, bs) {
		if (localTunnelConfig.enabled) {
			const tunnel = await localtunnel({ port: bs.options.get('port'), subdomain: localTunnelConfig.subdomain })
			console.log(`localtunnel server - ${chalk.bold.cyan(tunnel.url)}`)
		}
	});
  watch(path.watch.html, html);
	watch('dist/*.html', validateHTML);
	watch(path.watch.pug, pug);
  watch(path.watch.css, scss);
	watch(path.watch.js, js);
	watch(path.watch.js, jslint);
	watch(path.watch.img, sprites);
	watch(path.watch.img, images);
	watch(path.watch.img, imagesCopy);
	watch(path.watch.resource, resources);
};

export const ghpages = () => {
	ghpage.publish('dist', {
		branch: 'gh-pages'
	}, (err) => {
    if (err) {
      console.error(chalk.red.bgGray('Ошибка при публикации:'), chalk.red(err))
    } else {
      console.log(chalk.green.bgBlueBright( 'Проект успешно опубликован на GitHub Pages!'))
    }
  })
}

// exports

const build = series(clean, parallel(html, js, sprites, images, imagesCopy, resources, fonts), autoconnectfont, scss, jslint, validateHTML, cacheTask);
const serve = series(watcher);
const go = series(build, watcher);

export default isProd ? build : isPrev ? serve : go;
