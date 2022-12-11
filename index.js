const wa = require("@open-wa/wa-automate");
const fs = require("fs");
var parse = require("csv-parse");
const launchConfig = {
  popup: true,
  qrPopUpOnly: true,
  headless: false,
  useChrome:true
};
const probableMessage = [];
wa.create(launchConfig).then((client) => start(client));

async function start(client) {
  firstCheck(client);
  receiveNewAllMessages(client);
}

async function receiveNewAllMessages(client) {
  client.onMessage((message) => {
    // console.log(message);
    if (message.isGroupMsg === true) {
      // message received from a Group
      let messageBody = message.body.toString().toLowerCase(); //to make string comparision case insensitive
      readProbableMessages(message, client, messageBody);
      console.log(`INFO: Group Message Received`);
      readGroups(message, client);
    }
    if (message.isGroupMsg === false) {
      // message received from private chat
      console.log(
        `INFO: Private Message Received from ${message.sender.formattedName} saying => "${message.body}" `
      );
      let messageBody = message.body.toString().toLowerCase(); //to make string comparision case insensitive
      readProbableMessages(message, client, messageBody);
      readContacts(message, client);
    }
  });
}

function readContacts(message, client) {
  // checks for new Personal Messages and Archives from the selected contacts
  const data = [];
  fs.createReadStream("contacts.csv")
    .pipe(parse({ delimiter: "," }))
    .on("data", (r) => {
     // console.log(r);
      data.push(r);
    })
    .on("end", () => {
      console.log(data);
      data[0].forEach((contactUser) => {
        if (message.sender.formattedName === contactUser) {
          console.log(`\n----------------------------`);
          client.archiveChat(message.sender.id, true);
          console.log(
            `INFO : Private Message "${message.body}" was received from ${message.sender.formattedName} and has been archived`
          );
        }
      });
    });
}

function readGroups(message, client) {
  // checks for new Group Messages and Archives from the selected contact
  const data = [];
  fs.createReadStream("groups.csv")
    .pipe(parse({ delimiter: "," }))
    .on("data", (r) => {
      data.push(r);
    })
    .on("end", () => {
      data[0].forEach((groupUser) => {
        if (message.chat.formattedTitle === groupUser) {
          console.log(`\n----------------------------`);
          client.archiveChat(message.chat.groupMetadata.id, true);
          console.log(
            `INFO : Message "${message.body}" was received in Group "${message.chat.formattedTitle}" by "${message.sender.formattedName}" and has been archived`
          );
        }
      });
    });
}

async function firstCheck(client) {
  var allMessages = await client.getAllChats(false);
  var allGroups = await client.getAllGroups(true);
  allMessages.forEach((element) => {
    readContactsOnStart(element, client);
  });
  allGroups.forEach((element) => {
    readGroupsOnStart(element, client);
  });
  //console.log("All groups are =>", allGroups);
}

function readContactsOnStart(message, client) {
  // checks for Personal Messages on start of the script and Archives from the selected contacts
  const data = [];
  fs.createReadStream("contacts.csv")
    .pipe(parse({ delimiter: "," }))
    .on("data", (r) => {
      //console.log(r);
      data.push(r);
    })
    .on("end", () => {
      //console.log(data);
      data[0].forEach((contactUser) => {
        //console.log("Names for each contact are =>", contactUser);
        if (message.formattedTitle === contactUser) {
          console.log(`\n----------------------------`);
          client.archiveChat(message.id, true);
          console.log(
            `INFO : Private Chat "${message.formattedTitle}" has been archived`
          );
        }
      });
    });
}

function readGroupsOnStart(message, client) {
  // checks for Group Messages and Archives from the selected contact
  const data = [];
  fs.createReadStream("groups.csv")
    .pipe(parse({ delimiter: "," }))
    .on("data", (r) => {
      data.push(r);
    })
    .on("end", () => {
      data[0].forEach((groupUser) => {
        if (message.formattedTitle === groupUser) {
          console.log(`\n----------------------------`);
          client.archiveChat(message.id, true);
          console.log(
            `INFO : Group Message "${message.formattedTitle}" has been archived`
          );
        }
      });
    });
}

function readProbableMessages(message, client, messageBody) {
  // checks for new Group Messages and Archives from the selected contact
  const msgBdy = messageBody;
  const data = [];
  fs.createReadStream("probableMessages.csv")
    .pipe(parse({ delimiter: "," }))
    .on("data", (r) => {
      data.push(r);
      this.probableMessage = data[0];
      //return this.probableMessage;
      // console.log('The probableMessages are =>', r);
    })
    .on("end", () => {
     // console.log("The probable Message Array has =>", this.probableMessage);
      this.probableMessage.forEach((element) => {
        if (msgBdy.includes(element.toLowerCase(), 0)) {
         // console.log("Auto Reply Initiated");
          //await client.reply(message.sender.id, "Hello", message.id);
          //autoReply(message.sender, "Hello", message.id,client);
          randomReplyMessage(message, client);
        }
      });
    });
}

async function autoReply(message, sendingMessage, messageID,client) {
    randomReplyMessage();
    await client.reply(message.id, sendingMessage, messageID);
    console.log(`Auto Reply was sent to ${message.formattedName}`);
  }

async function randomReplyMessage(message,client) {
  const data = [];
  fs.createReadStream("autoReplyFile.csv")
    .pipe(parse({ delimiter: "," }))
    .on("data", (r) => {
      data.push(r);
      this.probableMessage = data[0];
      chooseReply(message,client,data[0]);
    });
}

async function chooseReply (message,client,data) {
    var randomQuesNum = Math.floor((Math.random() * data.length-1) + 1);
    //console.log('The random reply number is =>', randomQuesNum);
    //console.log('The reply is =>',data[randomQuesNum]);
    if (message.isGroupMsg === false){
      await client.reply(message.sender.id, data[randomQuesNum], message.id);
      console.log("----------------------------------------------------------");
    }

    if (message.isGroupMsg === true) {
      await client.reply(message.chat.id, data[randomQuesNum],message.id);
      console.log("----------------------------------------------------------");
    }
    
}
