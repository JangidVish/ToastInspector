require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { OpenAI } = require('openai');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Multer setup (memory storage)
const upload = multer({ storage: multer.memoryStorage() });

// OpenAI setup
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// 🔍 Check API Key at startup
(async () => {
    try {
        const models = await openai.models.list();
        console.log('✅ OpenAI Connected Successfully');
    } catch (err) {
        console.error('❌ OpenAI Connection Failed:', err.message);
    }
})();

console.log('🚀 Server initializing...');

// ================= ROUTE =================

app.post('/classify-toast', upload.single('image'), async (req, res) => {
    console.log('\n📥 Incoming request: /classify-toast');

    try {
        // 🔍 Check file
        if (!req.file) {
            console.log('❌ No file uploaded');
            return res.status(400).json({ error: 'No image uploaded' });
        }

        console.log('✅ File received:', req.file.originalname);
        console.log('📦 File size:', req.file.size, 'bytes');
        console.log('🧾 MIME type:', req.file.mimetype);

        const base64Image = req.file.buffer.toString('base64');
        const mimeType = req.file.mimetype;

        // 🧠 OpenAI call
        console.log('🤖 Sending request to OpenAI...');

        const response = await openai.responses.create({
            model: "gpt-4.1",
            input: [
                {
                    role: "user",
                    content: [
                        {
                            type: "input_text",
                            text: `You are a professional toast structural analysis system with computer vision expertise.
Analyze the provided toast image and inspect each visible toast for physical structural damage only.

Classification categories:
Intact – No visible cracks, splits, missing chunks, or crumbling.
Minor Cracks – Small surface-level cracks.
Major Cracks – Deep cracks compromising structure.
Broken – Split pieces or missing chunks.

Rules:
- Ignore color, texture, toppings
- Number toasts left to right, top to bottom
- Skip <30% visible toast
- Choose most severe damage

Output format:
Toast 1: [Category] – [Reason]
Toast 2: [Category] – [Reason]
Summary: ...`
                        },
                        {
                            type: "input_image",
                            image_url: `data:${mimeType};base64,${base64Image}`
                        }
                    ]
                }
            ],
            max_output_tokens: 150
        });

        console.log('✅ OpenAI response received');

        // 🔍 Extract safely
        let resultText = '';
        try {
            resultText = response.output[0].content[0].text;
        } catch (e) {
            console.error('❌ Failed to parse OpenAI response:', response);
            return res.status(500).json({
                error: 'Invalid response format from OpenAI',
                raw: response
            });
        }

        console.log('📝 Raw AI Output:\n', resultText);

        // ================= PARSING =================
        let category = "Unknown";
        let reason = resultText;

        let splitIndex = resultText.indexOf(" – ");
        if (splitIndex === -1) splitIndex = resultText.indexOf(" - ");

        if (splitIndex !== -1) {
            category = resultText.substring(0, splitIndex).trim();
            reason = resultText.substring(splitIndex + 3).trim();
        }

        // ================= RESPONSE =================
        res.json({
            success: true,
            category,
            reason,
            raw: resultText // 👈 always include for debugging
        });

    } catch (error) {
        console.error('❌ Error in /classify-toast:');

        if (error.response) {
            console.error('🔴 OpenAI API Error:', error.response.data);
        } else {
            console.error('🔴 General Error:', error.message);
        }

        res.status(500).json({
            error: 'Failed to classify image',
            details: error.message
        });
    }
});

// ================= SERVER =================

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});