const Telegram  = require('node-telegram-bot-api');
const { DBController } = require('./db_controller');
const { welcome, help, upload_help, inlinekeyboard, search_function, search_result, no_result, upload} = require('./text');
const util  = require('./util');
require(`dotenv`).config()

class AntiScamBot extends DBController {
    constructor(TELEGRAM_TOKEN, poll) {
        super({
            user: process.env.USER,
            host: process.env.HOST,
            database: process.env.DATABASE,
            password: process.env.PASSWORD,
            port: process.env.DATABASE_PORT,
            ssl: {
                rejectUnauthorized: true
            }
        });

        this.bot = new Telegram(TELEGRAM_TOKEN, {polling: poll});
        this.db = new DBController({
            user: process.env.USER,
            host: process.env.HOST,
            database: process.env.DATABASE,
            password: process.env.PASSWORD,
            port: process.env.DATABASE_PORT,
            ssl: {
                rejectUnauthorized: true
            }
        });
    }

    getPool() {
        return this.db.pool;
    }
    start() {
        try{
            this.bot.on(`message`, async (msg) => {

                const chatId = msg.chat.id;
                const text = msg.text;
                const chat_type = msg.chat.type;
                console.log(text)
                try {
                    if (text === `查询`) {
                        await this.bot.sendMessage(chatId, search_function)
                    }
                    else if (text === undefined) {
                        console.log("")
                    }
                    else if (text.startsWith(`查询`) || text.startsWith(`查詢`)) {
                        let phone, search_by_phone;
                        const search_word = text.slice(2, text.length)
                        if (!util.containsSpecialCharacters(search_word)) {

                            const search_by_name = await this.db.searchBySubstring("scammer", "name", search_word);
                            const search_by_username = await this.db.searchBySubstring("scammer", "username", search_word);
                            const search_by_personal_info = await this.db.searchBySubstring("scammer", "personal_info", search_word);
                            const search_by_reason = await this.db.searchBySubstring("scammer", "reason", search_word);

                            if (isNaN(parseInt(search_word, 10))) {
                                phone = ``
                                search_by_phone = []
                            } else {
                                phone = parseInt(search_word, 10)
                                search_by_phone = await this.db.searchBySubstring("scammer", "phone", phone);
                            }

                            if (search_by_name.length === 0 && search_by_username.length === 0 && search_by_personal_info.length === 0 && search_by_reason.length === 0 && search_by_phone.length === 0) {
                                await this.bot.sendMessage(chatId, no_result, {reply_markup: upload});
                                return;
                            } else {
                                let result = search_by_name.concat(search_by_username, search_by_personal_info, search_by_reason, search_by_phone);
                                const removedDuplicates = result.reduce((acc, curr) => {
                                    const isDuplicate = acc.some(item =>
                                        item.name === curr.name &&
                                        item.username === curr.username &&
                                        item.phone === curr.phone &&
                                        item.reason === curr.reason &&
                                        item.personal_info === curr.personal_info
                                    );

                                    if (!isDuplicate) {
                                        acc.push(curr);
                                    }
                                    return acc;
                                }, []);

                                let message = search_result;
                                removedDuplicates.forEach((item, index) => {
                                    if (item.username === null) {
                                        item.username = ``
                                    }
                                    if (item.phone === null) {
                                        item.phone = ``
                                    }
                                    if (item.personal_info === null) {
                                        item.personal_info = ``
                                    }
                                    message += `名字: ${item.name}\ntelegram用户名: @${item.username}\n手机号: ${item.phone}\n身份信息: ${item.personal_info}\n原因: ${item.reason}\n\n`;
                                });

                                await this.bot.sendMessage(chatId, message, {
                                    reply_markup: upload
                                });
                                return;
                            }
                        } else {
                            await this.bot.sendMessage(chatId, "⚠️ 请按照上传格式编辑信息")
                            return;
                        }
                    }
                } catch (error) {
                    console.error(error);
                }

                if (chat_type === `private`) {
                    switch (text) {
                        case '/start':
                            await this.bot.sendMessage(chatId, welcome, {parse_mode: `MarkdownV2`});
                            return;
                            break;
                        case '上传格式':
                            await this.bot.sendMessage(chatId, upload_help, {
                                reply_markup: inlinekeyboard
                            });
                            return;
                            break;
                        case '/help':
                            await this.bot.sendMessage(chatId, help, {parse_mode: 'MarkdownV2'});
                            return;
                            break;
                    }

                    if (text !== undefined && text.startsWith('/upload')) {
                        let extractedText = util.extractKeyValuePairs(text.replace('/upload', '').trim());
                        if (extractedText.名字 !== "" && extractedText.原因 !== "") {
                            if (extractedText.手机号 !== "" && !Number.isInteger(Number(extractedText.手机号))) {
                                await this.bot.sendMessage(chatId, "手机号格式不正确");
                                return;
                            }

                            let newtext = JSON.stringify(extractedText);
                            newtext = newtext
                                .replace("名字", "name")
                                .replace("telegram用户名", "username")
                                .replace("原因", "reason")
                                .replace("手机号", "phone")
                                .replace("身份信息", "personal_info");

                            // Handle empty values and replace with null
                            newtext = newtext.replace(/:""/g, ':null');

                            extractedText = JSON.parse(newtext);

                            console.log(extractedText);

                            try {
                                await this.db.insert('check', extractedText);
                                await this.bot.sendMessage(chatId, "数据已成功上传，请等待审核");
                            } catch (error) {
                                console.error("Error inserting data:", error);
                                await this.bot.sendMessage(chatId, "数据上传失败，请联系客服");
                            }
                        } else {
                            await this.bot.sendMessage(chatId, "名字和原因不能为空");
                        }
                    }
                }
            });
        }
        catch (error){
            this.bot.sendMessage(chatId, "机器人出现问题请联系客服")
        }
    }
    
}

module.exports = AntiScamBot;
