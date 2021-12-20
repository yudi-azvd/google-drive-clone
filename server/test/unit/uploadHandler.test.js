import fs from 'fs'
import { pipeline } from 'stream/promises'
import { describe, test, expect, jest, beforeEach } from '@jest/globals'

import UploadHandler from '../../src/uploadHandler'
import TestUtil from '../_util/testUtil'
import { resolve } from 'path'
import { logger } from '../../src/logger'

describe('UploadHandler test suite', () => {
  const ioObj = {
    to: (id) => ioObj,
    emit: (event, message) => { }
  }

  beforeEach(() => {
    jest.spyOn(logger, 'info')
      .mockImplementation()
  })

  describe('registerEvents', () => {
    test('should call onFile and onFinish on Busboy instance', () => {
      const uploadHandler = new UploadHandler({
        io: ioObj,
        socketId: '01'
      })

      jest.spyOn(uploadHandler, uploadHandler.onFile.name)
        .mockResolvedValue()

      const headers = {
        'content-type': 'multipart/form-data; boundary='
      }

      const onFinishMock = jest.fn()
      const busboyInstance = uploadHandler.registerEvents(headers, onFinishMock)

      const fileStream = TestUtil.generateReadableStream(['chunk', 'of', 'data'])

      // fileStream.on('data', msg => console.log('msg:'', msg.toString()))
      // console.log('eventos', busboyInstance.listeners('finish'))
      busboyInstance.emit('file', 'fieldname', fileStream, 'filename.txt')
      busboyInstance.listeners('finish')[0].call()

      expect(uploadHandler.onFile).toHaveBeenCalled()
      expect(onFinishMock).toHaveBeenCalled()
    })
  })

  describe('onFile', () => {
    test('given a stream file it should be saved on disk', async () => {
      const chunks = ['hey', 'dude']
      const downloadsFolder = '/tmp'
      const uploadHandler = new UploadHandler({
        io: ioObj,
        socketId: '01',
        downloadsFolder
      })

      const onData = jest.fn()
      jest.spyOn(fs, fs.createWriteStream.name)
        .mockImplementation(() => TestUtil.generateWritableStream(onData))

      const onTransform = jest.fn()
      jest.spyOn(uploadHandler, uploadHandler.handleFileBytes.name)
        .mockImplementation(() => TestUtil.generateTransformStream(onTransform))

      const params = {
        fieldname: 'video',
        file: TestUtil.generateReadableStream(chunks),
        filename: 'mockFile.mov'
      }

      await uploadHandler.onFile(...Object.values(params))

      expect(onData.mock.calls.join()).toEqual(chunks.join())
      expect(onTransform.mock.calls.join()).toEqual(chunks.join())

      const expectedFilename = resolve(uploadHandler.downloadsFolder, params.filename)
      expect(fs.createWriteStream).toHaveBeenCalledWith(expectedFilename)
    })
  })

  describe('handleFileBytes', () => {
    test('should call emit function and it is a transform stream', async () => {
      jest.spyOn(ioObj, ioObj.to.name)
      jest.spyOn(ioObj, ioObj.emit.name)

      const uploadHandler = new UploadHandler({
        io: ioObj,
        socketId: '01'
      })

      jest.spyOn(uploadHandler, uploadHandler.canExecute.name)
        .mockReturnValueOnce(true)

      const messages = ['hello']
      const source = TestUtil.generateReadableStream(messages)
      const onWrite = jest.fn()
      const target = TestUtil.generateWritableStream(onWrite)
      await pipeline(
        source,
        uploadHandler.handleFileBytes('filename.txt'),
        target
      )

      expect(ioObj.to).toHaveBeenCalledTimes(messages.length)
      expect(ioObj.emit).toHaveBeenCalledTimes(messages.length)
      // se handleFileBytes for um transform stream, o pipeline
      // vai continuar o processo passando os dados pra frente e 
      // chamar a função no target a cada chunk
      expect(onWrite).toHaveBeenCalledTimes(messages.length)
      expect(onWrite.mock.calls.join()).toEqual(messages.join())
    })

    test('given message timerDelay as 2secs it should emit only two messages during 2 seconds period', async () => {
      jest.spyOn(ioObj, ioObj.emit.name)
      
      const day = '2021-07-01 01:01'
      const twoSecondsPeriods = 2000

      const onFirstLastMessageSent = TestUtil.getTimeFromDate(`${day}:00`)
      // primeiro 'hello'
      const onFirstCanExecute = TestUtil.getTimeFromDate(`${day}:02`)
      // segundo 'hello' está fora da janela de tempo
      const onSecondUpdateLastMessageSent = onFirstCanExecute
      const onSecondCanExecute = TestUtil.getTimeFromDate(`${day}:03`)
      // 'world'
      const onThirdCanExecute = TestUtil.getTimeFromDate(`${day}:04`)

      TestUtil.mockDateNow([
        onFirstLastMessageSent,
        onFirstCanExecute,
        onSecondUpdateLastMessageSent,
        onSecondCanExecute,
        onThirdCanExecute,
      ])

      const messages = ['hello', 'hello', 'world']
      const filename = 'filename.avi'
      const expectedMessagesSent = 2
      const source = TestUtil.generateReadableStream(messages)
      const uploadHandler = new UploadHandler({
        io: ioObj,
        socketId: '01',
        messageTimeDelay: twoSecondsPeriods
      })

      await pipeline(
        source,
        uploadHandler.handleFileBytes(filename),
      )

      expect(ioObj.emit).toHaveBeenCalledTimes(expectedMessagesSent)

      const [firstCallResult, secondCallResult] = ioObj.emit.mock.calls

      expect(firstCallResult).toEqual([uploadHandler.ON_UPLOAD_EVENT, { processedAlready: 'hello'.length, filename }])
      expect(secondCallResult).toEqual([uploadHandler.ON_UPLOAD_EVENT, { processedAlready: messages.join('').length, filename }])
    })
  })

  describe('canExecute', () => {
    test('should return true when time is later than specified delay', () => {
      const timerDelay = 1000
      const uploadHandler = new UploadHandler({
        io: {},
        socketId: '',
        messageTimeDelay: timerDelay
      })

      const tickNow = TestUtil.getTimeFromDate('2021-07-01 00:00:03')
      TestUtil.mockDateNow([tickNow])

      const tick3secsBefore = TestUtil.getTimeFromDate('2021-07-01 00:00:00')
      const lastExecution = tick3secsBefore
      const canExecute = uploadHandler.canExecute(lastExecution)

      expect(canExecute).toBeTruthy()
    })

    test('should return false when time is not later than specified delay', () => {
      const timerDelay = 3000
      const uploadHandler = new UploadHandler({
        io: {},
        socketId: '',
        messageTimeDelay: timerDelay
      })

      const now = TestUtil.getTimeFromDate('2021-07-01 00:00:01')
      TestUtil.mockDateNow([now])

      const lastExecution = TestUtil.getTimeFromDate('2021-07-01 00:00:00')
      const canExecute = uploadHandler.canExecute(lastExecution)

      expect(canExecute).toBeFalsy()
    })
  })
})