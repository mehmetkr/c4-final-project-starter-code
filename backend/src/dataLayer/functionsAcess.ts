import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { FunctionItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';
import {GraphFunctions} from '../dataLayer/graphFunctions'

const logger = createLogger('FunctionsAccess')

// Functions: Implement the dataLayer logic


export const FunctionsAccess = {
    async getFunctions(userId: string): Promise<FunctionItem[]> {
      logger.info('Getting all functions for user', { userId })
      let doc = new DocumentClient({ service: new AWS.DynamoDB() })
      AWSXRay.captureAWSClient((doc as any).service)
      const result = await doc
        .query({
          TableName: process.env.TODOS_TABLE,
          KeyConditionExpression: 'userId = :userId',
          // FilterExpression: 'userId = :userId',
          ExpressionAttributeValues: {
            ':userId': userId
          }
        })
        .promise()
      const items = result.Items
      return items as FunctionItem[]
    },
  
    async createFunction(todo: FunctionItem): Promise<FunctionItem> {

      // Splitting todo name into three sections
      const nameSections = todo.name.split(',')
      const expression = nameSections[0]
      const xMin = parseFloat(nameSections[1])
      const xMax = parseFloat(nameSections[2])

      logger.info(expression, xMin, xMax)

      const imageBuffer = await GraphFunctions.generateGraph(expression, xMin, xMax)

      const fiName = 'graph' + todo.todoId.substring(0,4)

      GraphFunctions.saveGraphAsPng(imageBuffer, fiName)

      let doc = new DocumentClient({ service: new AWS.DynamoDB() })
      AWSXRay.captureAWSClient((doc as any).service)
      const result = await doc
        .put({
          TableName: process.env.TODOS_TABLE,
          Item: todo
        })
        .promise()
      return result.Attributes as FunctionItem
    },
  
    async updateFunction(
      userId: string,
      todoId: string,
      todoUpdate: TodoUpdate
    ): Promise<FunctionItem> {
      let doc = new DocumentClient({ service: new AWS.DynamoDB() })
      // AWSXRay.captureAWSClient((doc as any).service)
      const result = await doc
        .update({
          TableName: process.env.TODOS_TABLE,
          Key: {
            userId,
            todoId
          },
          UpdateExpression: 'set #name = :name, dueDate = :dueDate, done = :done',
          ExpressionAttributeNames: {
            '#name': 'name'
          },
          ExpressionAttributeValues: {
            ':name': todoUpdate.name,
            ':dueDate': todoUpdate.dueDate,
            ':done': todoUpdate.done
          }
        })
        .promise()
      return result.Attributes as FunctionItem
    },
  
    async deleteFunction(userId: string, todoId: string): Promise<string> {
      let doc = new DocumentClient({ service: new AWS.DynamoDB() })
      AWSXRay.captureAWSClient((doc as any).service)
      await doc
        .delete({
          TableName: process.env.TODOS_TABLE,
          Key: {
            "userId": userId,
            "todoId": todoId
          }
        })
        .promise()
      return todoId as string
    }
  };
