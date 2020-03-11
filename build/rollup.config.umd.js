import base from './rollup.config.base'
import { terser } from 'rollup-plugin-terser'

const config = Object.assign({}, base, {
  output: {
    file: 'dist/vue-chimera.umd.js',
    format: 'umd',
    name: 'vue-chimera',
    globals: {
      axios: 'Axios'
    },
    exports: 'auto'
  }
})

config.plugins.push(terser())

export default config