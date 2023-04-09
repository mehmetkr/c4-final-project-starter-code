import * as AWS from 'aws-sdk'
import 'source-map-support/register'
import {createLogger} from '../../utils/logger'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
const Logging = createLogger('generateUploadUrl.ts_logs')


export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId

  const uploadUrl = await uploadURL(todoId)

  Logging.info('Upload URL generated',uploadUrl,todoId)

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PATCH',
      'Access-Control-Allow-Headers': 'Accept'
    },
    body: JSON.stringify({
      uploadUrl
    })
}
}

const s3 = new AWS.S3({
  signatureVersion: 'v4' //
})

async function uploadURL(UploadURL:string){
  Logging.info('Inside upload URL', UploadURL)
      return s3.getSignedUrl('putObject', { 
      Bucket: process.env.ATTACHMENT_S3_BUCKET, 
      Key: UploadURL, 
      Expires: 300 
    })

}