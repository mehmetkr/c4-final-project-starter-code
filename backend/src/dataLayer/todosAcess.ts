import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';
import QuickChart from 'quickchart-js';
import fetch from 'node-fetch';


// import { v4 as uuid } from 'uuid';

// import * as fs from 'fs';

// const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('TodosAccess')


const s3 = new AWS.S3({
  signatureVersion: 'v4'
});


// TODO: Implement the dataLayer logic


export const TodosAccess = {
    async getTodos(userId: string): Promise<TodoItem[]> {
      logger.info('Getting all todos for user', { userId })
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
      return items as TodoItem[]
    },
  
    async createTodo(todo: TodoItem): Promise<TodoItem> {

      // Splitting todo name into three sections
      const nameSections = todo.name.split(',')
      const expression = nameSections[0]
      const xMin = parseFloat(nameSections[1])
      const xMax = parseFloat(nameSections[2])

      logger.info(expression, xMin, xMax)
      

      

      // Generating line graph
      // const graph = generateGraph(expression, xMin, xMax)

      generateGraph(expression, xMin, xMax)

      let doc = new DocumentClient({ service: new AWS.DynamoDB() })
      AWSXRay.captureAWSClient((doc as any).service)
      const result = await doc
        .put({
          TableName: process.env.TODOS_TABLE,
          Item: todo
        })
        .promise()
      return result.Attributes as TodoItem
    },

    
  
    async updateTodo(
      userId: string,
      todoId: string,
      todoUpdate: TodoUpdate
    ): Promise<TodoItem> {
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
      return result.Attributes as TodoItem
    },
  
    async deleteTodo(userId: string, todoId: string): Promise<string> {
      let doc = new DocumentClient({ service: new AWS.DynamoDB() })
      AWSXRay.captureAWSClient((doc as any).service)
      await doc
        .delete({
          TableName: process.env.TODOS_TABLE,
          Key: {
            userId,
            todoId
          }
        })
        .promise()
      return todoId as string
    }
  };

  
const generateGraph = async (expression: string, xMin: number, xMax: number) => {

  const xValues = [];
  const yValues = [];
  const step = (xMax - xMin) / 100;
  for (let i = 0; i < 100; i++) {
      const x = xMin + i * step;
      const y = eval(expression.replace(/x/g, x.toString()));
      xValues.push(x);
      yValues.push(y);
  }

  const chart = new QuickChart();
  chart.setConfig({
      type: 'line',
      data: {
          labels: xValues,
          datasets: [
              {
                  label: expression,
                  data: yValues,
                  fill: false,
                  borderColor: 'rgb(75, 192, 192)',
                  tension: 0.1
              }
          ]
      }
  });

  const url = await chart.getShortUrl();
  const response = await fetch(url);
  const buffer = await response.buffer();

  const params = {
      Bucket: process.env.ATTACHMENT_S3_BUCKET,
      Key: `${expression}.png`,
      Body: buffer,
      ContentType: 'image/png'
  };

  await s3.putObject(params).promise();

};