import babel from '@rollup/plugin-babel'
import terser from '@rollup/plugin-terser'
import common from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'

export default {
  input: 'index.ts',
  plugins: [
    typescript({
      compilerOptions: {
        target: 'es2015',
      }
    }),
    // babel({
    //   babelHelpers: 'bundled'
    // }),
    // common(),
    // resolve(),
    // terser({
    //   output: {comments: false}
    // })
  ],
  output: [
    {
      file: 'dist/index.min.js',
      format: 'umd',
      name: 'pixi-grid',
      sourcemap: true,
    },
    {
      file: 'dist/index.es.js',
      format: 'esm',
      name: 'pixi-grid',
      sourcemap: true,
    }
  ]
}
