const express = require('express');
const path = require('path');
const AntiScamBot = require('./bot');  // Correct import of AntiScamBot
const keep_alive = require(`./keep_alive`)
require(`dotenv`).config()

const bot = new AntiScamBot(process.env.BOT_TOKEN, true);  // Instantiate AntiScamBot

const app = express();
const PORT = process.env.PORT;

// Serve static files from the 'web' folder
app.use(express.static(path.join(__dirname, 'web')));
app.use(express.json());  // To parse JSON request bodies

// API endpoint to fetch data from the database
app.get('/api/check', async (req, res) => {
    try {
        const pool = bot.getPool();  // Correct way to get the pool
        const client = await pool.connect();
        const result = await client.query('SELECT * FROM "check"');
        client.release();
        res.json(result.rows);  // Send data back to frontend
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
});

app.get("*",  (req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'web', '404.html'))
})

// API endpoint to delete a row
app.delete('/api/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await bot.delete("check", {id:id})
        res.status(200).json({ message: 'Row deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
});



// API endpoint to insert a row into another table (e.g., "scammer")
app.post('/api/insert', async (req, res) => {
    try {
        await bot.insert("scammer", req.body)
        res.status(200).json({ message: 'Row inserted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://127.0.0.1:${PORT}`);
});

// Start the bot
bot.start();
