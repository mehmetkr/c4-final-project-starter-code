import { FunctionsAccess } from '../dataLayer/functionsAcess'
import { AttachmentUtils } from '../helpers/attachmentUtils';
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'
import * as createError from 'http-errors'

// TODO: Implement businessLogic

export const getTodosForUser = async (userId: string) => {
    const logger = createLogger('GetTodos')
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
  
  export const createTodo = async (
    userId: string,
    newTodo: CreateTodoRequest
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
    const todo: TodoItem = {
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

    return todo as TodoItem
  }
  
  export const deleteTodo = async (userId: string, todoId: string) => {
    const logger = createLogger('DeleteTodo')
    const result = await FunctionsAccess.deleteFunction(userId, todoId)
    if (result) AttachmentUtils.deleteAttachment(todoId)
    logger.info('Deleted function', { todoId })
    return result
  }
  
  export const updateTodo = async (
    userId: string,
    todoId: string,
    updatedTodo: UpdateTodoRequest
  ) => {
    const logger = createLogger('UpdateTodo')
    const todo = await FunctionsAccess.updateFunction(userId, todoId, updatedTodo)
    logger.info('Updated function', { todo })
    return todo
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