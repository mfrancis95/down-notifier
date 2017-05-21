const config = require(process.argv[2] || "./config.json");
const http = require("http");
const sendGrid = require("sendgrid")(config.sendGridAPIKey);

let down = false;

function checkWebsite() {
    http.get(config.url, isUp).on("error", isDown);
}

function emailMapper(toEmail) {
    return {email: toEmail};
}

function isDown() {
    if (down) {
        console.log(`${config.url} is still down.`);
    }
    else {
        down = true;
        console.log(`${config.url} is down. Sending email(s)...`);
        const request = sendGrid.emptyRequest({
            body: {
                content: [
                {
                    type: "text/plain",
                    value: config.message
                }
                ],
                from: {
                    email: config.fromEmail
                },
                personalizations: [
                {
                    to: config.toEmails.map(emailMapper),
                    subject: `${config.url} is down`
                }
                ]
            },
            method: "POST",
            path: "/v3/mail/send"
        });
        sendGrid.API(request);
    }
}

function isUp() {
    if (down) {
        down = false;
        console.log(`${config.url} is back up.`);
    }
    else {
        console.log(`${config.url} is up.`);
    }
}

checkWebsite();
setInterval(checkWebsite, 60000);
