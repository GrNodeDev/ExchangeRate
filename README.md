# Simple Exchange Rate Worker

In this project we will create a very simple Node.js script that will get exchange rates via a REST API and then email them out.  There is not much actual usefulness of this process, however the goal is to provide an introduction into the IronWorker service provided by Iron.io and the Lambda service provided by Amazon Web Services.

The project will first walk you through creating the script and deploying to IronWorker.  Once that is completed, we will copy the file, adjust a bit and then upload to Lambda and run.

## IronWorker

### Get the IronWorker CLI installed

We need to install the CLI in order to deploy our code to iron worker.  The CLI requires Ruby 1.9+.  Once Ruby is installed you can just run the following command:

```
gem install iron_worker_ng
```

### Create Your Project in Iron.io HUD

### Create Node Project

To create the node project open terminal in the location you wish to store your files.

1) Make the grnodedev_exchange_rates dir, then move into it

```
mkdir exchange_rates
cd exchange_rates
```

2) Initialize the node package file.

```
npm init
```

For this we can just accept all the defaults, we are not too concerned with the actual meta data for the package at this point.

3) To help us interact with the IronWorker we will need to install a helper module that exposes some of the config and payload variables.

```
npm install iron_node_helper --save
```

___note: the save flag will add the dependency to your node package file for you___

4) We will also be making some http requests in our worker so lets go ahead and add the request module as well.

```
npm install request --save
```

5) Since we will also be sending mail, so go ahead and install the mandrill client lib.

```
npm install node-mandrill --save
```

**At this point you can open your editor of choice and continue.**

### Configure Iron.io Credentials

If you do not already have a free Iron.io account, go over to their site and create one.  Once you have your account created, go ahead and
create your first project.

Supply the application with your iron.io credentials.  The CLI will need your credentials when pushing the code to your account.

Create a file in the root of your project called ```iron.json```.

```
{
  "project_id": "INSERT YOUR PROJECT ID HERE",
  "token": "INSERT YOUR TOKEN HERE"
}
```

### Write Your Worker

At this point we are going to write a very simple worker that will get the current exchange rates given the base value that is passed in via the payload.  For the project we will interact with the Fixer.io API which is located at ```http://fixer.io/```.

1) Create a file called ```ironworker.js```.  This will be our simple worker file.

2) Include the required modules at the top of the file.

```
var request = require('request');
var worker = require('iron_node_helper');
var mandrill = require('node-mandrill')('5RP2v9vIJByJydifVgw7OQ');
```

3) So we can understand what the helper file is doing, let's go ahead and log all the values that can be returned.

```
// outputs the payload params
console.log("params:", worker.params);
// outputs the actual config of the worker
console.log("config:", worker.config);
// outputs the task id that is being run
console.log("task_id:", worker.task_id);
```

4) Write a simple function that will make an HTTP request to get the current exchange rates given the base currency and then shoot an email out.

```
var emailCurrencies = function(base_currency, email, callback) {
    var options = {
        url: 'http://api.fixer.io/latest?base=' + base_currency
    };

    request(options, function (err, message, body) {
        if (err) {
            callback(err);
        } else {
            mandrill('/messages/send', {
                message: {
                    to: [{email: email}],
                    from_email: 'bot@grnodedev.com',
                    subject: "Your exchange rates!",
                    html: JSON.stringify(body)
                }
            }, function (err, response) {
                if (err) {
                    callback(err);
                } else {
                    callback();
                }
            });
        }
    });
};
```

5) Call the function so it is executed when the script loads.

```
emailCurrencies(worker.params.base_currency, worker.params.email, function(err){
	if(err){
		process.exit(1);
	}else{
		process.exit(0);
	}
});
```

### Create the .worker file

The worker file is a way to define your worker and all its dependencies.

1) Create a new file and add the following:

```
runtime "node"
exec "ironworker.js"
dir "node_modules"
file "package.json"
```

You can also allow IronWorker to remotely build your application, if this is desired you just need to omit the ```dir``` line above and include ```remote``` and a build command as shown below.

```
runtime "node"
exec "index.js"
build "npm install"
remote
```

2) Save the file with the name ```exchangerates.worker```

### Upload to IronWorker

To upload your worker you will just need to run

```
iron_worker upload exchangerates
```

### Add process to queue

```
iron_worker queue exchangerates -p '{"base_currency":"USD","email":"user@email.com"}'
```

## AWS Lambda

Now that we have a working application, lets see how that same application would be run in AWS Lambda.

1) Copy the ```ironworker.js``` file into a new file called ```lambda.js```

```
cp ironworker.js lambda.js
```

2) Remove the following blocks of code.

```
// outputs the payload params
console.log("params:", worker.params);
// outputs the actual config of the worker
console.log("config:", worker.config);
// outputs the task id that is being run
console.log("task_id:", worker.task_id);
```

3) Wrap the function to run in the exports.handler

```
exports.handler = function(event, context) {
	...
};

```

4) Modify the ```worker.params``` to ```event```.

5) Change the ```process.exit();``` to ```context.fail(err);``` and ```context.succeed('Function completed');```

5) Zip up the actual files, and upload into your Lambda function.