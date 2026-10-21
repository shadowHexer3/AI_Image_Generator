const imageCount = document.getElementById("imageCount");
const prompt = document.getElementById("prompt");
const generateBtn = document.getElementById("generateBtn");
const styleSelect = document.getElementById("styleSelect");

const stylePrompts = {
    realistic: "photorealistic, highly detailed, realistic lighting",
    anime: "anime style, detailed anime artwork",
    cyberpunk: "cyberpunk style, neon lights, futuristic atmosphere",
    "3d": "3D render, detailed 3D graphics",
    fantasy: "fantasy art, magical atmosphere, highly detailed"
};

generateBtn.addEventListener("click", async () => {

    if (prompt.value.trim() === "") {
        alert("Please enter a prompt.");
        return;
    }

    generateBtn.disabled = true;
    generateBtn.innerText = "Generating...";

    try {

        const response = await fetch("http://localhost:3000/generate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
          body: JSON.stringify({
    prompt: `${prompt.value} ${stylePrompts[styleSelect.value] || ""}`,
    count: Number(imageCount.value)
})
        });

        const data = await response.json();

console.log("SERVER RESPONSE:", data);

if (!response.ok) {
    alert(data.error || "Server error");
    return;
}

if (!data.images || !Array.isArray(data.images)) {
    alert("No images received from server.");
    return;
}

const gallery = document.getElementById("gallery");

gallery.innerHTML = "";

data.images.forEach(src => {

    const card = document.createElement("div");
    card.className = "image-card";

    const img = document.createElement("img");
    img.src = src;
    
    const regenerateBtn = document.createElement("button");
regenerateBtn.innerText = "🔄 Generate Again";
regenerateBtn.className = "regenerate-btn";

regenerateBtn.addEventListener("click", () => {
    generateBtn.click();
});

card.appendChild(regenerateBtn);
    const downloadBtn = document.createElement("a");
    downloadBtn.href = src;
    downloadBtn.download = "AI_Image.png";
    downloadBtn.innerText = "⬇ Download";
    downloadBtn.className = "download-btn";

    card.appendChild(img);
    card.appendChild(downloadBtn);

    gallery.appendChild(card);

    img.addEventListener("click", () => {
        const modal = document.getElementById("imageModal");
        const modalImage = document.getElementById("modalImage");

        modal.style.display = "flex";
        modalImage.src = img.src;
    });

});
    } catch (error) {

        console.error(error);
        alert("Something went wrong.");

    }

    generateBtn.disabled = false;
    generateBtn.innerText = "Generate";
    

});
const modal = document.getElementById("imageModal");
const closeModal = document.getElementById("closeModal");

closeModal.addEventListener("click", () => {
    modal.style.display = "none";
});

modal.addEventListener("click", (e) => {
    if (e.target === modal) {
        modal.style.display = "none";
    }
});
const styleButtons = document.querySelectorAll(".style-pills span");

styleButtons.forEach(button => {

    button.addEventListener("click", () => {

        const style = button.innerText
            .replace(/[^\w\s]/gi, "")
            .trim()
            .toLowerCase();

        if (stylePrompts[style]) {
            prompt.value = stylePrompts[style];
            prompt.focus();
        }

    });

});
const themeToggle = document.getElementById("themeToggle");

themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light-mode");

    if (document.body.classList.contains("light-mode")) {
        themeToggle.innerText = "☀️";
    } else {
        themeToggle.innerText = "🌙";
    }
});
const backToTop = document.getElementById("backToTop");

window.addEventListener("scroll", () => {

    if (window.scrollY > 400) {
        backToTop.style.display = "block";
    } else {
        backToTop.style.display = "none";
    }

});

backToTop.addEventListener("click", () => {

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

});