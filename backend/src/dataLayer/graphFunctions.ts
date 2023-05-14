import * as AWS from 'aws-sdk'
import QuickChart from 'quickchart-js';
import fetch from 'node-fetch';
import { createLogger } from '../utils/logger'

const s3 = new AWS.S3({
    signatureVersion: 'v4'
});

const logger = createLogger('FunctionsAccess')

export const GraphFunctions = {

    async generateGraph (expression: string, xMin: number, xMax: number) : Promise<Buffer> {

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
      
      },
      
      async saveGraphAsPng (iBuffer: Buffer, fileName: String) {
      
        const params = {
          Bucket: process.env.ATTACHMENT_S3_BUCKET,
          Key: `${fileName}.png`,
          Body: iBuffer,
          ContentType: 'image/png'
        };
      
        await s3.putObject(params).promise();
      
      }
}