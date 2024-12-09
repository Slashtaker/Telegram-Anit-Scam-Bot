const welcome = `👏使用查询骗子机器人🤖️\n
请发送“\`上传格式\`”或者点击底部按钮，复制上传格式编辑好发送给我即可，请尽可能编辑详细，身份信息跟手机号是关键信息，系统会自动审核❗️\n
[交流群](https://t.me/+_YyVfyNbUmk3YTc1)👈点击蓝色字进入`

const help = `📖 使用帮助\n
🔍 查询功能
• 发送 骗子查询 查看数据库信息
• 发送 查询\\+名字/手机号等 搜索骗子信息
例如: 查询张三 或 查询13800138000\n
📝 上传功能
• 发送 \`上传格式\` 获取上传模板
• 按照模板格式填写信息后发送
• 管理员审核通过后即可被查询\n
⚠️ 注意事项
• 请勿上传虚假信息
• 上传前请确认信息准确
• 对于违规操作将被限制使用`

const upload_help = `😐 请不要删除此机器人
启用机器人上传是方便大家更好打击骗子
减少各位大佬的损失!\n
👇 请按照以下格式上传信息\n
名字: 
telegram用户名: 
身份信息: 
手机号: 
原因: \n
❗️请不要上传非骗子信息
发送不相干信息直接无视
❗名字和原因不能留空\n
⚠️ 公益服务, 贵在坚持✊
耐心编辑文字不会浪费大佬们的时间😘`

const search_function = `🔍 查询功能
• 发送 骗子查询 查看数据库信息
• 发送 查询+名字/手机号等 搜索骗子信息
例如: 查询张三 或 查询13800138000`

const no_result = `🤖 没有找到相关骗子`

const search_result = `🔥 查询结果\n\n`

const inlinekeyboard = {
    inline_keyboard: [
        [
            {
                text: '一键复制模板',
                copy_text: {
                    text: "/upload\n名字: \ntelegram用户名: \n手机号: \n身份信息: \n原因: "
                }
            }
        ]
    ]
};

const upload = {
    inline_keyboard: [
        [
            {
                text: "📝骗子上传",
                url: "https://t.me/mlyFPZS_bot"
            }
        ]
    ]
}

module.exports = {welcome,help,upload_help,inlinekeyboard, search_function, no_result, search_result, upload}