import fs from 'fs'
import { describe, test, expect, jest } from '@jest/globals'
import FileHelper from '../../src/fileHelper'

describe('FileHelper', () => {
  describe('getFileStatus', () => {
    test('it should return file status in correct format', async () => {
      const statMock = {
        dev: 2054,
        mode: 33279,
        nlink: 1,
        uid: 1000,
        gid: 1000,
        rdev: 0,
        blksize: 4096,
        ino: 10355268,
        size: 17903,
        blocks: 40,
        atimeMs: 1639667037549.6619,
        mtimeMs: 1639667036989.666,
        ctimeMs: 1639667036989.666,
        birthtimeMs: 1639667036917.6667,
        atime: '2021-12-16T15:03:57.550Z',
        mtime: '2021-12-16T15:03:56.990Z',
        ctime: '2021-12-16T15:03:56.990Z',
        birthtime: '2021-12-16T15:03:56.918Z'
      }

      const mockUser  = 'username'
      process.env.USER = mockUser
      const filename = 'file.png'

      jest.spyOn(fs.promises, fs.promises.stat.name)
        .mockResolvedValue(statMock)

      jest.spyOn(fs.promises, fs.promises.readdir.name)
        .mockResolvedValue([filename])

      const result = await FileHelper.getFileStatus('/tmp')

      const expectedResult = [
        {
          size: '17.9 kB',
          lastModified: statMock.birthtime,
          owner: mockUser,
          file: filename
        }
      ]

      expect(fs.promises.stat).toHaveBeenCalledWith(`/tmp/${filename}`)
      expect(result).toMatchObject(expectedResult)
    })
  })
})