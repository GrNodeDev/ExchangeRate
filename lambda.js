var request = require('request');
var worker = require('iron_node_helper');
var mandrill = require('node-mandrill')('5RP2v9vIJByJydifVgw7OQ');

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

exports.handler = function(event, context) {
    emailCurrencies(event.base_currency, event.email, function (err) {
        if (err) {
            context.fail(err);
        } else {
            context.succeed('Function completed');
        }
    });
};