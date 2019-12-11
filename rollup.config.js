import svelte from 'rollup-plugin-svelte';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import livereload from 'rollup-plugin-livereload';
// 代码压缩
import { terser } from 'rollup-plugin-terser';
// 代码检测
import {
	eslint
} from 'rollup-plugin-eslint';
// css workflow
import {
	scss,
	postcss
} from 'svelte-preprocess'
import dev from 'rollup-plugin-dev'
const production = !process.env.ROLLUP_WATCH;

const postcssConfig = require('./postcss.config.js').plugins()

export default {
	input: 'src/main.js',
	output: {
		sourcemap: true,
		format: 'iife',
		name: 'app',
		file: 'dist/build/bundle.js'
	},
	plugins: [
		svelte({
			// enable run-time checks when not in production
			dev: !production,
			preprocess: [
				postcss({
					plugins: postcssConfig
				}),
				scss()
			],
			// we'll extract any component CSS out into
			// a separate file — better for performance
			// css: css => {
			// 	css.write('dist/build/bundle.css');
			// }
		}),

		!production && eslint({
			include: [
				'src/**/*.js'
			]
		}),
		// If you have external dependencies installed from
		// npm, you'll most likely need these plugins. In
		// some cases you'll need additional configuration —
		// consult the documentation for details:
		// https://github.com/rollup/rollup-plugin-commonjs
		resolve({
			browser: true,
			dedupe: importee => importee === 'svelte' || importee.startsWith('svelte/')
		}),
		commonjs(),

		// In dev mode, call `npm run start` once
		// the bundle has been generated
		// !production && serve(),
		// for proxy api
		!production && dev({
			dirs: ['dist'],
			port: 8080
			// proxy: { '/rank/*': 'http://chroperation.58.com/' }
		}),

		// Watch the `dist` directory and refresh the
		// browser on changes when not in production
		!production && livereload('dist'),

		// If we're building for production (npm run build
		// instead of npm run dev), minify
		production && terser()
	],
	watch: {
		clearScreen: false
	}
};
