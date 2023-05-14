import { FunctionsAccess } from '../dataLayer/functionsAcess'
import { AttachmentUtils } from '../helpers/attachmentUtils';
import { FunctionItem } from '../models/TodoItem'
import { CreateFunctionRequest } from '../requests/CreateFunctionRequest'
import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'
import * as createError from 'http-errors'

// TODO: Implement businessLogic

export const getFunctionsForUser = async (userId: string) => {
    const logger = createLogger('GetFunctions')
    try {
      let todos = await FunctionsAccess.getFunctions(userId)
      logger.info('Getting functions for user ' + userId)
      return todos
    } catch (e) {
      logger.error('Could not get functions', { e })
      return createError(
        500,
        'A fatal unexpected error prevented us from getting functions'
      )
    }
  }
  
  export const createFunction = async (
    userId: string,
    newTodo: CreateFunctionRequest
  ) => {
    const logger = createLogger('CreateTodo')
  
    if (newTodo.name == '') {
      logger.error('Function name cannot be empty')
      return createError(400, 'Function name cannot be empty')
    }
  
    const todoId = uuid.v4()
    const createdAt = new Date().toISOString()
    const attachmentUrl = `https://${process.env.ATTACHMENT_S3_BUCKET}.s3.amazonaws.com/` + 'graph' + todoId.substring(0,4) + '.png'
  
    logger.info('Constructing the function Item')
    const todo: FunctionItem = {
      userId,
      todoId,
      createdAt,
      name: newTodo.name,
      dueDate: newTodo.dueDate,
      done: false,
      attachmentUrl
    }
    await FunctionsAccess.createFunction(todo)
    logger.info('Created function', { todo })

    return todo as FunctionItem
  }
  
  export const deleteFunction = async (userId: string, todoId: string) => {
    const logger = createLogger('DeleteTodo')
    const result = await FunctionsAccess.deleteFunction(userId, todoId)
    if (result) AttachmentUtils.deleteAttachment(todoId)
    logger.info('Deleted function', { todoId })
    return result
  }

  export const createAttachmentPresignedUrl = async (todoId: string) => {
    const logger = createLogger('CreateAttachmentPresignedUrl')
    const url = await AttachmentUtils.signUrl(todoId)
    logger.info('Created attachment presigned url', { todoId, url })
    return url
  }
  
  export const deleteAttachment = async (todoId: string) => {
    const logger = createLogger('DeleteAttachment')
    const result = await AttachmentUtils.deleteAttachment(todoId)
    logger.info('Deleted attachment', { todoId })
    return result
  }