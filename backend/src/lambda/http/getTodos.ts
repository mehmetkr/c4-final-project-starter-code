import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { getUserId } from '../utils';
import { getTodosForUser as getTodosForUser } from '../../businessLogic/functions'
import { TodoItem } from '../../models/TodoItem'
import { createLogger } from '../..//utils/logger'


// TODO: Get all TODO items for a current user
export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // Write your code here
    try {
      const logger = createLogger('Testing 1')
      logger.info('Testing uId: ')
      let uId = getUserId(event)
      logger.info('User ID: ', {uId})
      const todos = (await getTodosForUser(uId)) as TodoItem[]
      return todos
        ? {
            statusCode: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Credentials': true,
              'Access-Control-Allow-Methods': 'OPTIONS,POST,PUT,GET,PATCH',
              'Content-Type': 'application/json',
              'Access-Control-Allow-Headers': 'Accept'
            },
            body: JSON.stringify({
              items: todos
            })
          }
        : {
            statusCode: 404,
            body: JSON.stringify({
              error: 'Todo does not exist '
            }) 
          }
    } catch (e: any) {
      return {
        statusCode: 502,
        body: JSON.stringify({
          error: 'A fatal unexpected error occured: ' + e.message
        })
      }
    }
  }
)
handler.use(
  cors({
    credentials: true
  })
)