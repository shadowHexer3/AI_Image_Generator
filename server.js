
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

async function fetchWithRetry(url, options = {}, attempts = 3) {
    for (let attempt = 1; ; attempt++) {
        try {
            return await fetch(url, options);
        } catch (error) {
            const code = error.cause?.code || error.code;
            const retryable = [
                "EAI_AGAIN",
                "ENOTFOUND",
                "ECONNRESET",
                "ETIMEDOUT"
            ].includes(code);

            if (!retryable || attempt >= attempts) {
                throw error;
            }

            console.log(`Temporary network error: ${code}`);
            await new Promise(resolve =>
                setTimeout(resolve, attempt * 1500)
            );
        }
    }
}

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/imag.html");
});

app.post("/generate", async (req, res) => {
    try {
        const { prompt, count } = req.body;

        if (!prompt) {
            return res.status(400).json({
                error: "Prompt is required"
            });
        }

        const imageCount = Math.min(Number(count) || 1, 4);

        const response = await fetchWithRetry(
            "https://aihorde.net/api/v2/generate/async",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": "0000000000",
                    "Client-Agent": "AI-Image-Generator:1.0"
                },
                body: JSON.stringify({
                    prompt,
                    models: ["stable_diffusion"],
                    params: {
                        width: 512,
                        height: 512,
                        steps: 15,
                        n: imageCount
                    }
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({
                error: data.message || "AI Horde request failed"
            });
        }

        const requestId = data.id;
        let finished = false;

        for (let i = 0; i < 120; i++) {
            await new Promise(resolve =>
                setTimeout(resolve, 2000)
            );

            const checkResponse = await fetchWithRetry(
                `https://aihorde.net/api/v2/generate/check/${requestId}`,
                {
                    headers: {
                        "Client-Agent": "AI-Image-Generator:1.0"
                    }
                }
            );

            const checkData = await checkResponse.json();

            if (checkData.done) {
                finished = true;
                break;
            }
        }

        if (!finished) {
            return res.status(504).json({
                error: "Image generation took too long. Please try again."
            });
        }

        const statusResponse = await fetchWithRetry(
            `https://aihorde.net/api/v2/generate/status/${requestId}`,
            {
                headers: {
                    "Client-Agent": "AI-Image-Generator:1.0"
                }
            }
        );

        const statusData = await statusResponse.json();
        const images = [];

        for (const generation of statusData.generations || []) {
            if (!generation.img) continue;

            const imageResponse = await fetchWithRetry(
                generation.img
            );

            if (!imageResponse.ok) continue;

            const imageBuffer = await imageResponse.arrayBuffer();
            const base64 = Buffer.from(imageBuffer).toString("base64");
            const contentType =
                imageResponse.headers.get("content-type") || "image/png";

            images.push(`data:${contentType};base64,${base64}`);
        }

        if (images.length === 0) {
            return res.status(500).json({
                error: "No images were generated."
            });
        }

        res.json({ images });

    } catch (error) {
        console.error("Generation error:", error);

        res.status(500).json({
            error: "Image generation failed"
        });
    }
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});
