import { nodeResolve } from '@rollup/plugin-node-resolve';
import { babel } from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import del from 'rollup-plugin-delete';
import fs from 'fs';

const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

// Common plugins for all builds
const commonPlugins = [
  nodeResolve({
    browser: true,
    preferBuiltins: false
  }),
  babel({
    babelHelpers: 'bundled',
    exclude: 'node_modules/**',
    presets: [
      ['@babel/preset-env', {
        modules: false,
        targets: {
          browsers: ['> 1%', 'last 2 versions', 'not dead']
        }
      }]
    ]
  })
];

const external = [
  // Mark these as external so they're not bundled
  'react',
  'react-dom',
  'jquery'
];

export default [
  // Clean dist folder first
  {
    input: 'src/index.js',
    plugins: [
      del({ targets: 'dist/*' })
    ]
  },
  
  // ES Module build (unminified)
  {
    input: 'src/index.js',
    external,
    plugins: commonPlugins,
    output: {
      file: 'dist/tablixjs.esm.js',
      format: 'es',
      sourcemap: true,
      banner: `/**
 * TablixJS v${packageJson.version}
 * ${packageJson.description}
 * (c) ${new Date().getFullYear()} ${packageJson.author}
 * Released under the ${packageJson.license} License.
 */`
    }
  },

  // ES Module build (minified)
  {
    input: 'src/index.js',
    external,
    plugins: [
      ...commonPlugins,
      terser({
        compress: {
          pure_getters: true,
          unsafe: true,
          unsafe_comps: true
        }
      })
    ],
    output: {
      file: 'dist/tablixjs.esm.min.js',
      format: 'es',
      sourcemap: true,
      banner: `/**
 * TablixJS v${packageJson.version} | ${packageJson.license} License
 */`
    }
  },

  // CommonJS build
  {
    input: 'src/index.js',
    external,
    plugins: commonPlugins,
    output: {
      file: 'dist/tablixjs.cjs.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
      banner: `/**
 * TablixJS v${packageJson.version}
 * ${packageJson.description}
 * (c) ${new Date().getFullYear()} ${packageJson.author}
 * Released under the ${packageJson.license} License.
 */`
    }
  },

  // UMD build (unminified) - for browser <script> tags
  {
    input: 'src/index.js',
    external,
    plugins: commonPlugins,
    output: {
      file: 'dist/tablixjs.umd.js',
      format: 'umd',
      name: 'TablixJS',
      exports: 'named',
      sourcemap: true,
      globals: {
        'react': 'React',
        'react-dom': 'ReactDOM',
        'jquery': '$'
      },
      banner: `/**
 * TablixJS v${packageJson.version}
 * ${packageJson.description}
 * (c) ${new Date().getFullYear()} ${packageJson.author}
 * Released under the ${packageJson.license} License.
 */`
    }
  },

  // UMD build (minified) - for browser <script> tags
  {
    input: 'src/index.js',
    external,
    plugins: [
      ...commonPlugins,
      terser({
        compress: {
          pure_getters: true,
          unsafe: true,
          unsafe_comps: true
        }
      })
    ],
    output: {
      file: 'dist/tablixjs.umd.min.js',
      format: 'umd',
      name: 'TablixJS',
      exports: 'named',
      sourcemap: true,
      globals: {
        'react': 'React',
        'react-dom': 'ReactDOM',
        'jquery': '$'
      },
      banner: `/**
 * TablixJS v${packageJson.version} | ${packageJson.license} License
 */`
    }
  }
];
