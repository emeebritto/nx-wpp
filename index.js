const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const NxTerminal = require("./nx-terminal");
const crypto = require('crypto');
const axios = require('axios');
require('dotenv').config();


const nxTerminal = new NxTerminal();
const client = new Client({
	authStrategy: new LocalAuth({ clientId: "nx-client" })
});

client.on('qr', (qr) => {
	// Generate and scan this code with your phone
	console.log('QR RECEIVED', qr);
	qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
	console.log('Client is ready!');
});

// client.on('message', msg => {
//   console.log({ msg })
//   if (msg.body == '!ping') {
//   	msg.reply('pong');
//   }
// });

client.on('message', async(msg) => {
	const chat = await msg.getChat();
	const command = msg.body.split(' ')[0];
	// const sender = msg.from.includes("81506021") ? msg.to : msg.from;
	const sender = msg.from;
	if (command.includes("stick")) return generateSticker(msg, sender);

	const predicted = await nxTerminal.predict(msg.body)
	for (msgObj of predicted) {
		if (["text", "video", "document", "animation"].includes(msgObj.msgType)) {
			await client.sendMessage(sender, msgObj.msg);
		} else if (msgObj.msgType === "photo") {
			const media = await MessageMedia.fromUrl(msgObj.msg);
			await client.sendMessage(sender, media);
		}
	}
});

const generateSticker = async (msg, sender) => {
	if(msg.type === "image") {
		try {
			const { data } = await msg.downloadMedia();
			const image = await new MessageMedia("image/jpeg", data, "image.jpg");
			await client.sendMessage(sender, image, { sendMediaAsSticker: true });
		} catch(e) {
			msg.reply("❌ image processing failed.");
		}
	} else if (msg.type === "video") {
		try {
			const uuid = crypto.randomBytes(16);
			const media = await msg.downloadMedia();
			const video = await new MessageMedia("video/mp4", media?.data, `${uuid.toString("hex")}.mp4`);
			await client.sendMessage(sender, video, { sendMediaAsSticker: true });
		} catch(e) {
			console.log({ error: e });
			msg.reply("❌ gif/video processing failed.");
		}
	} else {
		try {
			const url = msg.body.substring(msg.body.indexOf(" ")).trim();
			const { data } = await axios.get(url, {responseType: 'arraybuffer'});
			const returnedB64 = Buffer.from(data).toString('base64');
			const image = await new MessageMedia("image/jpeg", returnedB64, "image.jpg");
			await client.sendMessage(sender, image, { sendMediaAsSticker: true });
		} catch(e) {
			msg.reply("❌ Something is wrong, maybe that link is invalid.");
		}
	}
}

client.initialize();