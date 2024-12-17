const Telegram = require('node-telegram-bot-api');
const { DBController } = require('./db_controller');
const { welcome, help, upload_help, inlinekeyboard, search_function, search_result, no_result, upload } = require('./text');
const util = require('./util');
require('dotenv').config();

class AntiScamBot extends DBController {
    constructor(TELEGRAM_TOKEN, poll) {
        const dbConfig = {
            user: process.env.USER,
            host: process.env.HOST,
            database: process.env.DATABASE,
            password: process.env.PASSWORD,
            port: process.env.DATABASE_PORT,
            ssl: { rejectUnauthorized: true }
        };

        super(dbConfig);
        this.bot = new Telegram(TELEGRAM_TOKEN, { polling: poll });
        this.db = new DBController(dbConfig);
    }

    getPool() {
        return this.db.pool;
    }

    start() {
        this.bot.on('message', this.handleMessage.bind(this));
    }

    async handleMessage(msg) {
        try {
            await this.processMessage(msg);
        } catch (error) {
            console.error('Error processing message:', error);
            await this.bot.sendMessage(msg.chat.id, "机器人出现问题请联系客服");
        }
    }

    async processMessage(msg) {
        const { id: chatId, type: chat_type } = msg.chat;
        const text = msg.text;
        console.log(text);

        if (!text) return;

        if (text === '查询') {
            await this.bot.sendMessage(chatId, search_function);
            return;
        }

        if (text.startsWith('查询') || text.startsWith('查詢')) {
            await this.handleSearch(text, chatId);
            return;
        }

        if (chat_type === 'private') {
            await this.handlePrivateChat(text, chatId);
        }
    }

    async handleSearch(text, chatId) {
        const search_word = text.slice(2);
        if (util.containsSpecialCharacters(search_word)) {
            await this.bot.sendMessage(chatId, "⚠️ 请按照上传格式编辑信息");
            return;
        }

        const searchResults = await this.performSearch(search_word);
        const message = searchResults.length === 0 ? 
            no_result : 
            this.formatSearchResults(searchResults);
        
        await this.bot.sendMessage(chatId, message, { reply_markup: upload });
    }

    async performSearch(search_word) {
        const search_by_name = await this.db.searchBySubstring("scammer", "name", search_word);
        const search_by_username = await this.db.searchBySubstring("scammer", "username", search_word);
        const search_by_personal_info = await this.db.searchBySubstring("scammer", "personal_info", search_word);
        const search_by_reason = await this.db.searchBySubstring("scammer", "reason", search_word);

        let search_by_phone = [];
        if (!isNaN(parseInt(search_word, 10))) {
            const phone = parseInt(search_word, 10);
            search_by_phone = await this.db.searchBySubstring("scammer", "phone", phone);
        }

        return [...search_by_name, ...search_by_username, ...search_by_personal_info, ...search_by_reason, ...search_by_phone]
            .reduce((acc, curr) => {
                if (!acc.some(item => item.name === curr.name && item.username === curr.username && item.phone === curr.phone && item.reason === curr.reason && item.personal_info === curr.personal_info)) {
                    acc.push(curr);
                }
                return acc;
            }, []);
    }

    formatSearchResults(results) {
        let message = search_result;
        results.forEach(item => {
            message += `名字: ${item.name}\ntelegram用户名: @${item.username || ''}\n手机号: ${item.phone || ''}\n身份信息: ${item.personal_info || ''}\n原因: ${item.reason}\n\n`;
        });
        return message;
    }

    async handlePrivateChat(text, chatId) {
        switch (text) {
            case '/start':
                await this.bot.sendMessage(chatId, welcome, { parse_mode: 'MarkdownV2' });
                break;
            case '上传格式':
                await this.bot.sendMessage(chatId, upload_help, { reply_markup: inlinekeyboard });
                break;
            case '/help':
                await this.bot.sendMessage(chatId, help, { parse_mode: 'MarkdownV2' });
                break;
            default:
                if (text && text.startsWith('/upload')) {
                    await this.handleUpload(text, chatId);
                }
        }
    }

    async handleUpload(text, chatId) {
        let extractedText = util.extractKeyValuePairs(text.replace('/upload', '').trim());
        if (extractedText.名字 && extractedText.原因) {
            if (extractedText.手机号 && !Number.isInteger(Number(extractedText.手机号))) {
                await this.bot.sendMessage(chatId, "手机号格式不正确");
                return;
            }

            let newtext = JSON.stringify(extractedText)
                .replace("名字", "name")
                .replace("telegram用户名", "username")
                .replace("原因", "reason")
                .replace("手机号", "phone")
                .replace("身份信息", "personal_info")
                .replace(/:""/g, ':null');

            extractedText = JSON.parse(newtext);

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

module.exports = AntiScamBot;
