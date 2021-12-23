import fs from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import FormData from 'form-data'
import { describe, test, expect, jest, beforeEach, beforeAll, afterAll } from '@jest/globals'

import Routes from '../../src/routes'
import TestUtil from '../_util/testUtil'
import { logger } from '../../src/logger'

describe('Routes integration Test', () => {
  const ioObj = {
    to: (id) => ioObj,
    emit: (event, message) => { }
  }

  let downloadsFolder = ''
  beforeAll(async () => {
    downloadsFolder = await fs.promises.mkdtemp(join(tmpdir(), 'downloads-'))
  })

  afterAll(async () => {
    downloadsFolder = await fs.promises.rm(downloadsFolder, { recursive: true })
  })

  beforeEach(() => {
    jest.spyOn(logger, 'info')
      .mockImplementation()
  })

  describe('getFileStatus', () => {
    test('should upload file to the folder', async () => {
      const filename = 'joker-editor.png'
      const fileStream = fs.createReadStream(`./test/integration/mocks/${filename}`)
      const response = TestUtil.generateWritableStream(() => { })

      const form = new FormData()
      form.append('photo', fileStream)

      const defaultParams = {
        req: Object.assign(form, {
          headers: form.getHeaders(),
          method: 'POST',
          url: '?socketId=10'
        }),
        res: Object.assign(response, {
          setHeader: jest.fn(),
          writeHead: jest.fn(),
          end: jest.fn(),
        }),
        values: () => Object.values(defaultParams)
      }

      const routes = new Routes(downloadsFolder)
      routes.setSocketInstance(ioObj)
      let dir = await fs.promises.readdir(downloadsFolder)

      expect(dir).toEqual([])
      await routes.handler(...defaultParams.values())

      dir = await fs.promises.readdir(downloadsFolder)
      expect(dir).toEqual([filename])

      expect(defaultParams.res.writeHead).toHaveBeenCalledWith(200)
      const expectedResult = JSON.stringify({ result: 'File uploaded with success!' })
      expect(defaultParams.res.end).toHaveBeenCalledWith(expectedResult)
    })
  })
})