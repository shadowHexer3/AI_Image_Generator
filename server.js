const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3000;

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

        // Send request to AI Horde
        const response = await fetch(
            "https://aihorde.net/api/v2/generate/async",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": "0000000000",
                    "Client-Agent": "AI-Image-Generator:1.0"
                },
                body: JSON.stringify({
                    prompt: prompt,
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
            console.log(data);

            return res.status(response.status).json({
                error: data.message || "AI Horde request failed"
            });
        }

        const requestId = data.id;

        console.log("AI Horde request:", requestId);

        // Wait until generation is finished
        let finished = false;
        let statusData;

        for (let i = 0; i < 120; i++) {
            await new Promise(resolve => setTimeout(resolve, 2000));

            const checkResponse = await fetch(
                `https://aihorde.net/api/v2/generate/check/${requestId}`,
                {
                    headers: {
                        "Client-Agent": "AI-Image-Generator:1.0"
                    }
                }
            );

            const checkData = await checkResponse.json();

            console.log("Waiting:", checkData);

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

        // Get the generated images
        const statusResponse = await fetch(
            `https://aihorde.net/api/v2/generate/status/${requestId}`,
            {
                headers: {
                    "Client-Agent": "AI-Image-Generator:1.0"
                }
            }
        );

        statusData = await statusResponse.json();
        console.log("STATUS DATA:", JSON.stringify(statusData, null, 2));

const images = [];

for (const generation of statusData.generations || []) {

    if (!generation.img) continue;

    console.log("IMAGE FOUND:", generation.img);

    const imageResponse = await fetch(generation.img);

    if (!imageResponse.ok) {
        console.log("IMAGE DOWNLOAD FAILED:", imageResponse.status);
        continue;
    }

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

res.json({
    images: images
});

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Image generation failed"
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});