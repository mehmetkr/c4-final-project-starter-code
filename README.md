# Serverless Function Plotter

This is a simple Function Plotter and Storer application using AWS Lambda and Serverless framework. 

# Functionality of the application

This application will allow creating/uploading and downloading graphical images of mathematical functions.

## Prerequisites

* <a href="https://manage.auth0.com/" target="_blank">Auth0 account</a>
* <a href="https://github.com" target="_blank">GitHub account</a>
* <a href="https://nodejs.org/en/download/package-manager/" target="_blank">NodeJS</a> version up to 12.xx 
* Serverless 
   * Create a <a href="https://dashboard.serverless.com/" target="_blank">Serverless account</a> user
   * Install the Serverless Framework’s CLI  (up to VERSION=2.21.1). Refer to the <a href="https://www.serverless.com/framework/docs/getting-started/" target="_blank">official documentation</a> for more help.
   ```bash
   npm install -g serverless@2.21.1
   serverless --version
   ```
   * Login and configure serverless to use the AWS credentials 
   ```bash
   # Login to your dashboard from the CLI. It will ask to open your browser and finish the process.
   serverless login
   # Configure serverless to use the AWS credentials to deploy the application
   # You need to have a pair of Access key (YOUR_ACCESS_KEY_ID and YOUR_SECRET_KEY) of an IAM user with Admin access permissions
   sls config credentials --provider aws --key YOUR_ACCESS_KEY_ID --secret YOUR_SECRET_KEY --profile serverless
   ```
   
# Instructions for use

Next to "Enter a new function in terms of x", enter a mathematical function expression, followed by a comma, followed by the starting value of x, followed by a comma and finally the ending value of x expression next to and click on the button to save and upload a graph of the function. Here are a few correct examples:

    x + 5, -2, 5
    x * x - 4, -10, 10
    3*x*x*x - 2*x*x + x - 2, 0, 20

After an image is created, right click and open it in a new tab to view an enlarged version and to download it.