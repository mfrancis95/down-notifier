const config = require(process.argv[2] || "./config.json");
const http = require("http");
const sendGrid = require("sendgrid")(config.sendGrid.apiKey);

let down = false;

if (!config.hasOwnProperty("503")) {
    config["503"] = true;
}

function checkWebsite() {
    http.get(config.url, isUp).on("error", isDown);
}

function emailMapper(toEmail) {
    return {email: toEmail};
}

function isDown() {
    if (down) {
        log(`${config.url} is still down.`);
    }
    else {
        down = true;
        log(`${config.url} is down. Sending email(s)...`);
        sendEmails();
    }
}

function isUp(response) {
    if (config["503"] && response.statusCode === 503) {
        isDown();
    }
    else if (down) {
        down = false;
        if (config.sendGrid.message.up) {
            log(`${config.url} is back up. Sending email(s)...`);
            sendEmails();
        }
        else {
            log(`${config.url} is back up.`);
        }
    }
    else {
        log(`${config.url} is up.`);
    }
}

function log(message) {
    console.log(`${new Date()} - ${message}`);
}

function sendEmails() {
    const request = sendGrid.emptyRequest({
        body: {
            content: [
            {
                type: "text/plain",
                value: config.sendGrid.message[down ? "down" : "up"]
            }
            ],
            from: {
                email: config.sendGrid.from
            },
            personalizations: [
            {
                to: config.sendGrid.to.map(emailMapper),
                subject: `${config.url} is ${down ? "down" : "back up"}`
            }
            ]
        },
        method: "POST",
        path: "/v3/mail/send"
    });
    sendGrid.API(request);
}

checkWebsite();
setInterval(checkWebsite, config.interval);
