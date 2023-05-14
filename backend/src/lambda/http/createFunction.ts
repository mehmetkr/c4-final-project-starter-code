import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { CreateFunctionRequest } from '../../requests/CreateFunctionRequest'
import { getUserId } from '../utils';
import { createFunction } from '../../businessLogic/functions'
import { createLogger } from '../../utils/logger'

const logger = createLogger('createFunction')

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info('Create Function event:  ', {...event})

    const newTodo: CreateFunctionRequest = JSON.parse(event.body)

    let getUser =  getUserId(event);
    const item = await createFunction(getUser, newTodo)
    return item.todoId
    ? { 
        statusCode: 201,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
          'Access-Control-Allow-Methods': 'OPTIONS,POST,PUT,GET,PATCH',
          'Content-Type': 'application/json',
          'Access-Control-Allow-Headers': 'Accept'
        },
        body: JSON.stringify({
          item
        })
      }
    : {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true
        },
        body: JSON.stringify({
          item
        })
      }
}
)

handler.use(
cors({
  credentials: true
})
)
