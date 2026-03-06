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
                            text: `You are a professional toast structural analysis system with computer vision expertise.
Analyze the provided toast image and inspect each visible toast for physical structural damage only.

Classification categories:

Intact – No visible cracks, splits, missing chunks, or crumbling. The toast holds its full original shape.
Minor Cracks – Small surface-level cracks or hairline fractures present, but the toast remains in one piece with no missing sections.
Major Cracks – Deep or wide cracks that visibly compromise the structure, though the toast is still mostly whole.
Broken – Visible splits into separate pieces, missing chunks, or significant crumbling that fragments the toast.

Classification rules:

Ignore all color, roast level, toppings, or surface texture — assess ONLY physical structural integrity
Number each toast left to right, top to bottom as they appear in the image
If toasts are stacked or overlapping, classify only the fully or mostly visible ones; skip any toast that is less than 30% visible
If multiple damage levels are present, classify based on the most severe visible damage

Output format (strict):

If the image contains one toast:
[Category] – [One sentence describing the structural evidence observed.]

If the image contains multiple toasts:
Toast 1: [Category] – [One sentence describing the structural evidence observed.]
Toast 2: [Category] – [One sentence describing the structural evidence observed.]
Toast 3: [Category] – [One sentence describing the structural evidence observed.]
...

End with a one-line summary if there are 3 or more toasts:
Summary: [X] toasts analyzed – most are [dominant category], with [any notable exceptions].
Note: Dont comment on toast color, roast level, toppings, or surface texture. Only comment about the structural integrity of the toast i.e toast is broken or crack in it or not.
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
