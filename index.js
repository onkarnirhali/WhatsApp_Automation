const wa = require('@open-wa/wa-automate');
const fs = require('fs')
var parse = require('csv-parse')

wa.create().then(client => start(client));

async function start(client) {
    firstCheck(client)
    receiveNewAllMessages(client);
}

async function receiveNewAllMessages(client) {
    client.onMessage(message => {
       // console.log(message);
        if (message.isGroupMsg === true) { // message received from a Group
            console.log(`INFO: Group Message Received`);
            readGroups(message, client);
        }
        if (message.isGroupMsg === false) { // message received from private chat
            console.log(`INFO: Private Message Received `);
            readContacts(message, client);
        }
    })
}

function readContacts(message, client) { // checks for new Personal Messages and Archives from the selected contacts
    const data = [];
    fs.createReadStream('contacts.csv')
        .pipe(parse({ delimiter: ',' }))
        .on('data', (r) => {
            console.log(r);
            data.push(r);
        })
        .on('end', () => {
            console.log(data);
            data[0].forEach(contactUser => {
                console.log("Names for each contact are =>", contactUser);
                if (message.sender.formattedName === contactUser) {
                    console.log(`\n----------------------------`);
                    client.archiveChat(message.sender.id, true);
                    console.log(`INFO : Private Message "${message.body}" was received from ${message.sender.formattedName} and has been archived`);
                }
            });
        })
}

function readGroups(message, client) {// checks for new Group Messages and Archives from the selected contact
    const data = [];
    fs.createReadStream('groups.csv')
        .pipe(parse({ delimiter: ',' }))
        .on('data', (r) => {
            data.push(r);
        })
        .on('end', () => {
            data[0].forEach(groupUser => {
                if (message.chat.formattedTitle === groupUser) {
                    console.log(`\n----------------------------`);
                    client.archiveChat(message.chat.groupMetadata.id, true);
                    console.log(`INFO : Message "${message.body}" was received in Group "${message.chat.formattedTitle}" by "${message.sender.formattedName}" and has been archived`);
                }
            });
        })
}

async function firstCheck(client) {
    var allMessages = await client.getAllChats(false);
    var allGroups = await client.getAllGroups(true);
    allMessages.forEach(element => {
        readContactsOnStart(element, client);
    });
    allGroups.forEach(element => {
        readGroupsOnStart(element, client);
    });
    //console.log("All groups are =>", allGroups);
}

function readContactsOnStart(message, client) { // checks for Personal Messages on start of the script and Archives from the selected contacts
    const data = [];
    fs.createReadStream('contacts.csv')
        .pipe(parse({ delimiter: ',' }))
        .on('data', (r) => {
            //console.log(r);
            data.push(r);
        })
        .on('end', () => {
            //console.log(data);
            data[0].forEach(contactUser => {
                //console.log("Names for each contact are =>", contactUser);
                if (message.formattedTitle === contactUser) {
                    console.log(`\n----------------------------`);
                    client.archiveChat(message.id, true);
                    console.log(`INFO : Private Chat "${message.formattedTitle}" has been archived`);
                }
            });
        })
}

function readGroupsOnStart(message, client) {// checks for Group Messages and Archives from the selected contact
    const data = [];
    fs.createReadStream('groups.csv')
        .pipe(parse({ delimiter: ',' }))
        .on('data', (r) => {
            data.push(r);
        })
        .on('end', () => {
            data[0].forEach(groupUser => {
                if (message.formattedTitle === groupUser) {
                    console.log(`\n----------------------------`);
                    client.archiveChat(message.id, true);
                    console.log(`INFO : Group Message "${message.formattedTitle}" has been archived`);
                }
            });
        })
}