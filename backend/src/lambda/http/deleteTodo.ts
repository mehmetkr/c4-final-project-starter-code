import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'
import { deleteTodo } from '../../businessLogic/functions'
import { getUserId } from '../utils'


export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId
    // TODO: Remove a TODO item by id
    
	let getUser =  getUserId(event);

    try {
      await deleteTodo(todoId, getUser)
    } catch(e) {
      return { 
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
          'Access-Control-Allow-Methods': 'OPTIONS,POST,PUT,GET,DELETE,PATCH',
          'Content-Type': 'application/json',
          'Access-Control-Allow-Headers': 'Accept'
        },
        body: JSON.stringify({
          error: e.message
          
        })
      }
    }
}
)

handler
  .use(httpErrorHandler())
  .use(
    cors({
      credentials: true
    })
  )
