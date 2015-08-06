var request = require('request');
var worker = require('iron_node_helper');
var mandrill = require('node-mandrill')('5RP2v9vIJByJydifVgw7OQ');

// outputs the payload params
console.log("params:", worker.params);
// outputs the actual config of the worker
console.log("config:", worker.config);
// outputs the task id that is being run
console.log("task_id:", worker.task_id);

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

emailCurrencies(worker.params.base_currency, worker.params.email, function(err){
    if(err){
        process.exit(1);
    }else{
        process.exit(0);
    }
});