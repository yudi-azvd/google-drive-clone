import { describe, test, expect, jest } from '@jest/globals'
import Routes from '../../src/routes'

describe('Routes test suite ', () => {
  describe('setSocketInstance', () => {
    test('should store io instance', () => {
      const routes = new Routes()
      const ioObj = {
        to: (id) => ioObj,
        emit: (event, message) => { }
      }

      routes.setSocketInstance(ioObj)
      expect(routes.io).toStrictEqual(ioObj)
    })
  })

  describe('handler', () => {
    const defaultParams = {
      req: {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        method: '',
        body: {}
      },
      res: {
        setHeader: jest.fn(),
        writeHead: jest.fn(),
        end: jest.fn(),
      },
      values: () => Object.values(defaultParams)
    }

    test('given an inexistent route it should choose the default route', () => {
      const routes = new Routes()
      const params = { ...defaultParams }

      params.req.method = 'inexistent'
      routes.handler(...params.values())

      expect(params.res.end).toHaveBeenCalledWith('hello world')
    })

    test('it should set any request with CORS enabled', () => {
      const routes = new Routes()
      const params = { ...defaultParams }

      params.req.method = 'inexistent'
      routes.handler(...params.values())

      expect(params.res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origon', '*')
    })

    test.todo('given method OPTIONS it should choose options route')
    test.todo('given method POST it should choose post route')
    test.todo('given method GET it should choose get route')
  })
})