import { describe, test, expect, jest } from '@jest/globals'
import Routes from '../../src/routes'

describe('Routes test suite ', () => {
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
    test('given an inexistent route it should choose the default route', async () => {
      const routes = new Routes()
      const params = { ...defaultParams }

      params.req.method = 'inexistent'
      await routes.handler(...params.values())

      expect(params.res.end).toHaveBeenCalledWith('hello world')
    })

    test('it should set any request with CORS enabled', async () => {
      const routes = new Routes()
      const params = { ...defaultParams }

      params.req.method = 'inexistent'
      await routes.handler(...params.values())

      expect(params.res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origon', '*')
    })

    test('given method OPTIONS it should choose options route', async () => {
      const routes = new Routes()
      const params = { ...defaultParams }

      params.req.method = 'OPTIONS'
      await routes.handler(...params.values())

      expect(params.res.writeHead).toHaveBeenCalledWith(204)
      expect(params.res.end).toHaveBeenCalled()
    })

    test('given method POST it should choose post route', async () => {
      const routes = new Routes()
      const params = { ...defaultParams }

      params.req.method = 'POST'
      jest.spyOn(routes, routes.post.name).mockResolvedValue()
      await routes.handler(...params.values())

      expect(routes.post).toHaveBeenCalled()
    })

    test('given method GET it should choose get route', async () => {
      const routes = new Routes()
      const params = { ...defaultParams }

      params.req.method = 'GET'
      jest.spyOn(routes, routes.get.name).mockResolvedValue()
      await routes.handler(...params.values())

      expect(routes.get).toHaveBeenCalled()
    })
  })

  describe('get', () => {
    test('given method GET it should list all downloaded files', async () => {
      const routes = new Routes()
      const params = { ...defaultParams }

      const fileStatusesMock = [
        {
          size: '17.9 kB',
          lastModified: '2021-12-16T15:03:56.918Z',
          owner: 'username',
          file: 'file.txt'
        }
      ]

      jest.spyOn(routes.fileHelper, routes.fileHelper.getFileStatus.name)
        .mockResolvedValue(fileStatusesMock)

      params.req.method = 'GET'
      await routes.handler(...params.values())

      expect(params.res.writeHead).toHaveBeenCalledWith(200)
      expect(params.res.end).toHaveBeenCalledWith(JSON.stringify(fileStatusesMock))
    })
  })
})