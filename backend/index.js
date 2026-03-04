require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { OpenAI } = require('openai');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Set up Multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

app.post('/classify-toast', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded' });
        }

        const base64Image = req.file.buffer.toString('base64');
        const mimeType = req.file.mimetype;

        // Call OpenAI Vision API
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `You are a professional toast classification system with computer vision expertise.
Analyze the provided toast image and classify each visible toast into exactly one of the following categories based on visual evidence:

Perfectly Roasted – Uniform golden-brown color across the entire surface, no pale patches, no dark spots, slight sheen indicating moisture retention
Lightly Roasted – Predominantly pale yellow or beige, soft appearance, little to no browning, surface looks similar to untoasted bread
Heavily Roasted – Deep brown to dark brown across most of the surface, visibly dry and crisp texture, edges noticeably darker than center but no black areas
Burnt – Black or charred areas covering 20%+ of the surface, visible carbonization, possible smoke residue or ash-like texture
Broken – Physical structural damage: visible cracks, splits, missing chunks, or crumbled pieces — assess color independently but classify as Broken if structurally compromised

Classification rules:

If multiple categories seem applicable, choose the dominant visual characteristic
Ignore toppings (butter, jam, etc.) — assess only the bread surface beneath
Evaluate both sides if visible; classify based on the worse side
Do not infer from context — base classification solely on visual evidence in the image
Number each toast left to right, top to bottom as they appear in the image
If toasts are stacked or overlapping, classify only the fully or mostly visible ones; skip any toast that is less than 30% visible

Output format (strict):

If the image contains one toast:
[Category] – [One sentence explaining the key visual evidence.]
If the image contains multiple toasts:

Toast 1: [Category] – [One sentence explaining the key visual evidence.]
Toast 2: [Category] – [One sentence explaining the key visual evidence.]
Toast 3: [Category] – [One sentence explaining the key visual evidence.]
...

End with a one-line summary if there are 3 or more toasts:
Summary: [X] toasts analyzed – most are [dominant category], with [any notable exceptions].

`
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:${mimeType};base64,${base64Image}`
                            }
                        }
                    ]
                }
            ],
            max_tokens: 150,
        });

        const resultText = response.choices[0].message.content.trim();

        // Parse result text (Assumes format "Category - Reason" or similar)
        // E.g., "Heavily roasted - edges are dark and crispy, center still golden."
        let category = "Unknown";
        let reason = resultText;

        const splitIndex = resultText.indexOf(" - ");
        if (splitIndex !== -1) {
            category = resultText.substring(0, splitIndex).trim();
            reason = resultText.substring(splitIndex + 3).trim();
        } else {
            // Fallback: try to match known categories at the start
            const categories = ['Perfectly roasted', 'Lightly roasted', 'Heavily roasted', 'Burnt', 'Broken'];
            for (const cat of categories) {
                if (resultText.toLowerCase().startsWith(cat.toLowerCase())) {
                    category = cat;
                    reason = resultText.substring(cat.length).replace(/^[^a-zA-Z0-9]+/, '').trim();
                    break;
                }
            }
        }

        res.json({
            category,
            reason
        });
    } catch (error) {
        console.error('Error classifying toast:', error);
        res.status(500).json({ error: 'Failed to classify image' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
