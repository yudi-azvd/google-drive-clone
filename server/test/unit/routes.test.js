import fs from 'fs'
import FormData from 'form-data'

import { describe, test, expect, jest } from '@jest/globals'
import Routes from '../../src/routes'
import TestUtil from '../_util/testUtil'
import UploadHandler from '../../src/uploadHandler'
import { logger } from '../../src/logger'

describe('Routes test suite ', () => {
  const request = TestUtil.generateReadableStream(['some', 'file', 'bytes'])
  const response = TestUtil.generateWritableStream(() => { })

  const defaultParams = {
    req: Object.assign(request, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      method: '',
      body: {}
    }),
    res: Object.assign(response, {
      setHeader: jest.fn(),
      writeHead: jest.fn(),
      end: jest.fn(),
    }),
    values: () => Object.values(defaultParams)
  }

  beforeEach(() => {
    jest.spyOn(logger, 'info')
      .mockImplementation()
  })

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

  describe('post', () => {
    test('it should validate post route workflow', async () => {
      const routes = new Routes('/tmp')
      const options = {
        ...defaultParams
      }

      options.req.method = 'POST'
      options.req.url = '?socketId=10'

      jest.spyOn(
        UploadHandler.prototype,
        UploadHandler.prototype.registerEvents.name
      )
        .mockImplementation((headers, onFinish) => {
          const writable = TestUtil.generateWritableStream(() => { })
          writable.on('finish', onFinish)
          return writable
        })

      await routes.handler(...options.values())

      expect(UploadHandler.prototype.registerEvents).toHaveBeenCalled()
      expect(options.res.writeHead).toHaveBeenCalledWith(200)

      const expectedResult = JSON.stringify({ result: 'File uploaded with success!' })
      expect(defaultParams.res.end).toHaveBeenCalledWith(expectedResult)
    })
  })
})