import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';
import QuickChart from 'quickchart-js';
import fetch from 'node-fetch';

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

      const imageBuffer = await generateGraph(expression, xMin, xMax)

      const fiName = 'graph' + todo.todoId.substring(0,4)

      saveGraphAsPng(imageBuffer, fiName)

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

  
const generateGraph = async (expression: string, xMin: number, xMax: number) : Promise<Buffer> => {

  let config = `{
    type: 'line',
    data: {
      datasets: [
        {
          data: [`

  const step = (xMax - xMin) / 100;
  for (let i = 0; i < 100; i++) {
      const x = xMin + i * step;
      const y = eval(expression.replace(/x/g, x.toString()));
      config += '{ x: ' + x + ', y: ' + y + '}, '
  }

  config += "], fill: false, borderColor: 'blue', pointRadius: 0,}, ], }, options: { legend: { display: false, }, scales: { xAxes: [ { type: 'linear', scaleLabel: { display: true, labelString: 'x', fontSize: 16, }, ticks: { fontSize: 12, }, }, ], yAxes: [ { scaleLabel: { display: true, labelString: 'f(x)', fontSize: 16, }, ticks: { fontSize: 12, }, }, ], }, }, width: 1500, height: 1000,}"

  logger.info(config)

  const chart = new QuickChart();

  chart.setConfig(config);

  const url = await chart.getShortUrl();
  const response = await fetch(url);
  const buffer = await response.buffer();

  return buffer

};

const saveGraphAsPng = async (iBuffer: Buffer, fileName: String) => {

  const params = {
    Bucket: process.env.ATTACHMENT_S3_BUCKET,
    Key: `${fileName}.png`,
    Body: iBuffer,
    ContentType: 'image/png'
  };

  await s3.putObject(params).promise();

};
