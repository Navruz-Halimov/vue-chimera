import Vue from 'vue'
import VueChimera from "../../src/VueChimera";
import Endpoint from "../../src/Endpoint";
import NullEndpoint from "../../src/Endpoint";

global.window = {
  __STATE__: {
    chimera: {}
  }
}

Vue.config.devtools = false
Vue.config.productionTip = false

const chimeraFactory = function (endpoints, vm, options) {
  vm = vm || new Vue()
  return new VueChimera(vm, endpoints, {
    deep: true,
    ssrContext: '__STATE__.chimera',
    ...options
  })
}

const axiosMock = () => {
  const axiosResponse = {
    data: { test: 1 },
    headers: {},
    status: 200,
  }
  const axiosMock = jest.fn(() => Promise.resolve(axiosResponse))
  axiosMock.request = axiosMock
  return axiosMock
}

describe('test-vue-chimera', function () {

  it('should instantiate null endpoint', function () {
    const { endpoints } = chimeraFactory({
      n: null,
    })

    expect(endpoints.n).toBeInstanceOf(NullEndpoint)
  });

  it('should bind vm to listeners', function () {
    let self, endpoint
    const spy = jest.fn()
    const chimera = chimeraFactory({
      test: {
        url: '/test',
        auto: false,
        on: {
          test (newEndpoint) {
            self = this
            endpoint = newEndpoint
          },
          event: 'spy'
        }
      },
    }, new Vue({
      methods: {
        spy
      }
    }))

    chimera.endpoints.test.emit('test')
    chimera.endpoints.test.emit('event')
    expect(self).toBe(chimera._vm)
    expect(endpoint).toBe(chimera.endpoints.test)
    expect(spy).toBeCalled()
  });

  it('should cancel all endpoints', function () {
    const chimera = chimeraFactory({
      test: '/1',
      test2: '/2',
    })

    const spy = jest.spyOn(Endpoint.prototype, 'cancel')

    chimera.cancelAll()
    chimera.endpoints.$cancelAll()
    expect(spy).toBeCalledTimes(4)
  });

  it('should work with $loading', async function () {
    const vm = new Vue()
    const chimera = new VueChimera(vm, {
      test: '/test',
      test2: '/test2',
    }, {
      axios: axiosMock()
    })

    const p = chimera.endpoints.test.reload()
    expect(chimera.endpoints.$loading).toBeTruthy()
    await p
    expect(chimera.endpoints.$loading).toBeFalsy()
  });

  it('should start interval', async function () {
    jest.useFakeTimers()
    const startSpy = jest.spyOn(Endpoint.prototype, 'startInterval')
    const stopSpy = jest.spyOn(Endpoint.prototype, 'stopInterval')
    const chimera = chimeraFactory({
      test: {
        url: 'interval',
        interval: 1000,
        axios: axiosMock(),
      }
    })

    const endpoints = chimera.endpoints

    expect(startSpy).toBeCalledTimes(1)
    expect(endpoints.test.looping).toBeTruthy()

    chimera.endpoints.test.stopInterval()
    expect(stopSpy).toBeCalled()

  });
})
