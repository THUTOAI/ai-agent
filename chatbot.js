// Store inventory database
const storeInventory = {
    "streetcode clothing tshirt": { price: "R500", stock: true, image: "images/tshirt.jpg", colors: ["White"], sizes: ["S", "M", "L", "XL", "XXL"] },
    "streetcode clothing pants": { price: "R450.00", stock: true, image: "images/pants.jpg", colors: ["Black", "Navy", "Grey", "Khaki"], sizes: ["S", "M", "L", "XL", "XXL"] },
    "streetcode clothing jacket": { price: "R650.00", stock: true, image: "images/jacket.jpg", colors: ["Black"], sizes: ["S", "M", "L", "XL", "XXL"] },
    "streetcode clothing beanies": { price: "R150.00", stock: true, image: "images/beanies.jpg", colors: ["White", "Grey", "Blue", "Red", "Black", "Pink", "Yellow", "Green"] },
    "streetcode clothing sweater": { price: "R650.00", stock: true, image: "images/sweater.jpg", colors: ["Black"], sizes: ["S", "M", "L", "XL", "XXL"] },
    "streetcode clothing cardigan": { price: "R1200.00", stock: true, image: "images/cardigan.jpg", colors: ["Black", "White", "Red"], sizes: ["S", "M", "L", "XL", "XXL"] },
    "streetcode clothing hoodie": { price: "R750.00", stock: true, image: "images/hoodie.jpg", colors: ["Black", "Brown", "Red"], sizes: ["S", "M", "L", "XL", "XXL"] },
    "streetcode clothing mafia tracksuits": { price: "R1200.00", stock: true, image: "images/mafia-tracksuits.jpg", colors: ["Black", "Navy"], sizes: ["S", "M", "L", "XL", "XXL"] },
    "streetcode clothing sc woven tracksuits": { price: "R1000.00", stock: true, image: "images/sc-woven-tracksuits.jpg", colors: ["Black", "White"], sizes: ["S", "M", "L", "XL", "XXL"] },
    "streetcode clothing handbag": { price: "R1000.00", stock: true, image: "images/handbag.jpg", colors: ["Black", "Green"] },
    "streetcode clothing cap": { price: "R200.00", stock: true, image: "images/cap.jpg", colors: ["Black", "Brown", "White", "Red", "Blue"] },
};

// Greeting messages for the bot
const greetings = [
    "Hello! Welcome to our store. What can I help you find today?",
    "Hi there! I'm here to help. Feel free to ask about any of our products!",
    "Welcome! You can ask me about our items and their prices.",
];

// Messages for unknown inputs
const unknownInputMessages = [
    "I'm not sure what you're asking for. Could you try asking about a specific item?",
    "Sorry, I didn't understand that. Try asking about shirts, pants, shoes, or other items we have.",
    "I can help you find items and prices! What are you looking for?",
];

// Messages when an item is not in stock
const outOfStockMessages = [
    "Unfortunately, that item is currently out of stock.",
    "Sorry, we don't have that in stock right now.",
];

// Messages when a requested colour is unavailable
const unavailableColorMessages = [
    (color, product) => `Sorry, the ${product} is not in stock in ${color}. Please choose one of the available colours.`,
    (color, product) => `Unfortunately, ${product} is out of stock in ${color}. Please ask about another colour.`,
];

// Messages when the user exits
const byeMessages = [
    "Thanks for shopping with Streetcode Clothing! Goodbye! 👋",
    "See you soon! Have a great day! 🛍️",
    "Thanks for visiting Streetcode Clothing! Come back soon!",
];

// Chat elements
const chatWindow = document.getElementById("chat-window");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const ownerAccessButton = document.getElementById("owner-access-button");
const ownerPanel = document.getElementById("owner-panel");
const closeOwnerPanelButton = document.getElementById("close-owner-panel");
const ownerLoginView = document.getElementById("owner-login-view");
const ownerDashboardView = document.getElementById("owner-dashboard-view");
const ownerLoginForm = document.getElementById("owner-login-form");
const ownerPinInput = document.getElementById("owner-pin");
const ownerLoginError = document.getElementById("owner-login-error");
const ownerLockButton = document.getElementById("owner-lock-button");
const stockMonthInput = document.getElementById("stock-month");
const clearStockMonthButton = document.getElementById("clear-stock-month");
const stockEntryForm = document.getElementById("stock-entry-form");
const stockEntryStatus = document.getElementById("stock-entry-status");
const stockSummary = document.getElementById("stock-summary");
const stockTableBody = document.getElementById("stock-table-body");
const emptyStockState = document.getElementById("empty-stock-state");
const inventoryUploadForm = document.getElementById("inventory-upload-form");
const inventoryUploadStatus = document.getElementById("inventory-upload-status");
const conversation = [];
let ownerInventory = [];

const ownerPin = "1234";
const stockRecordsKey = "streetcodeStockRecords";
let ownerUnlocked = false;

// Track if chatbot has been initialized
let isInitialized = false;

// Event listeners
sendButton.addEventListener("click", handleUserMessage);
ownerAccessButton.addEventListener("click", openOwnerPanel);
closeOwnerPanelButton.addEventListener("click", closeOwnerPanel);
ownerLoginForm.addEventListener("submit", unlockOwnerStockRoom);
ownerLockButton.addEventListener("click", lockOwnerStockRoom);
stockMonthInput.addEventListener("change", renderStockReport);
clearStockMonthButton.addEventListener("click", clearSelectedMonth);
stockEntryForm.addEventListener("submit", addManualStockRecord);
inventoryUploadForm.addEventListener("submit", uploadInventory);
userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        handleUserMessage();
    }
});

// Initialize chatbot with greeting
async function initializeChatbot() {
    if (!isInitialized) {
        const randomGreeting =
            greetings[Math.floor(Math.random() * greetings.length)];
        displayMessage(randomGreeting, "bot");
        isInitialized = true;
    }
}

async function uploadInventory(event) {
    event.preventDefault();
    const fileInput = document.getElementById("inventory-file");
    if (!fileInput.files[0]) {
        return;
    }
    const formData = new FormData();
    formData.append("file", fileInput.files[0]);
    inventoryUploadStatus.textContent = "Loading workbook...";
    try {
        const response = await fetch("/api/inventory/upload", { method: "POST", body: formData });
        const data = await response.json();
        if (!response.ok) {
            console.log(data);
            throw new Error(data.error || "Workbook upload failed.");
        }
        await loadStockReport();
        inventoryUploadStatus.textContent = data.message;
        fileInput.value = "";
    } catch (error) {
        inventoryUploadStatus.textContent = error.message;
    }
}

async function loadStockReport() {
    try {
        const response = await fetch("/api/stock-report");
        const data = await response.json();
        if (response.ok && Array.isArray(data.inventory)) {
            ownerInventory = data.inventory;
            renderStockReport(data.inventory);
        }
    } catch (error) {
        renderStockReport();
    }
}

// Display a message in the chat window (text only)
function displayMessage(text, sender) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${sender}-message`;

    const messageText = document.createElement("div");
    messageText.className = "message-text";
    messageText.textContent = text;

    messageDiv.appendChild(messageText);
    chatWindow.appendChild(messageDiv);

    // Auto-scroll to the latest message
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function getCurrentMonth() {
    return new Date().toISOString().slice(0, 7);
}

function getStockRecords() {
    try {
        const records = JSON.parse(localStorage.getItem(stockRecordsKey) || "[]");
        return Array.isArray(records) ? records : [];
    } catch (error) {
        return [];
    }
}

function saveStockRecord(product, color, size, quantity, month = getCurrentMonth()) {
    const records = getStockRecords();
    records.push({ product, color, size, quantity, month, recordedAt: new Date().toISOString() });
    localStorage.setItem(stockRecordsKey, JSON.stringify(records));
}

function openOwnerPanel() {
    ownerPanel.hidden = false;
    ownerLoginError.textContent = "";
    if (ownerUnlocked) {
        showOwnerDashboard();
    } else {
        ownerLoginView.hidden = false;
        ownerDashboardView.hidden = true;
        ownerPinInput.focus();
    }
}

function closeOwnerPanel() {
    ownerPanel.hidden = true;
}

function unlockOwnerStockRoom(event) {
    event.preventDefault();
    if (ownerPinInput.value !== ownerPin) {
        ownerLoginError.textContent = "That PIN is not recognised.";
        ownerPinInput.select();
        return;
    }
    ownerUnlocked = true;
    ownerPinInput.value = "";
    showOwnerDashboard();
}

function showOwnerDashboard() {
    ownerLoginView.hidden = true;
    ownerDashboardView.hidden = false;
    stockMonthInput.value = stockMonthInput.value || getCurrentMonth();
    loadStockReport();
}

function lockOwnerStockRoom() {
    ownerUnlocked = false;
    ownerDashboardView.hidden = true;
    ownerLoginView.hidden = false;
    ownerPinInput.focus();
}

async function addManualStockRecord(event) {
    event.preventDefault();
    const product = document.getElementById("stock-product").value.trim();
    const color = document.getElementById("stock-colour").value.trim();
    const size = document.getElementById("stock-size").value.trim();
    const quantity = Number(document.getElementById("stock-quantity").value);
    if (!product || !color || !size || !Number.isInteger(quantity) || quantity < 1) {
        return;
    }
    const item = ownerInventory.find((entry) =>
        entry.name.toLowerCase() === product.toLowerCase()
    );
    if (!item?.sku) {
        stockEntryStatus.textContent = "Choose a product from the loaded inventory.";
        return;
    }
    try {
        const response = await fetch("/api/sales", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sku: item.sku, quantity }),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || "Stock count could not be recorded.");
        }
        stockEntryForm.reset();
        document.getElementById("stock-quantity").value = "1";
        stockEntryStatus.textContent = "Stock count added.";
        renderStockReport(data.inventory);
    } catch (error) {
        stockEntryStatus.textContent = error.message;
    }
}

function clearSelectedMonth() {
    const selectedMonth = stockMonthInput.value || getCurrentMonth();
    const remainingRecords = getStockRecords().filter((record) => record.month !== selectedMonth);
    localStorage.setItem(stockRecordsKey, JSON.stringify(remainingRecords));
    stockEntryStatus.textContent = `Cleared stock counts for ${selectedMonth}.`;
    renderStockReport();
}

function renderStockReport(serverInventory = null) {
    if (serverInventory) {
        const totalSold = serverInventory.reduce((total, item) => total + item.sold_quantity, 0);
        const reorderCount = serverInventory.reduce((total, item) => total + item.reorder_quantity, 0);
        stockSummary.textContent = `${totalSold} unit${totalSold === 1 ? "" : "s"} sold | ${reorderCount} unit${reorderCount === 1 ? "" : "s"} recommended for reorder`;
        stockTableBody.innerHTML = serverInventory
            .sort((first, second) => second.sold_quantity - first.sold_quantity)
            .map((item, index) => `
                <tr><td>${index + 1}</td><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.colors.join(", ") || "-")}</td><td>${escapeHtml(item.sizes.join(", ") || "-")}</td><td>${item.stock_quantity}</td><td>${item.sold_quantity}</td><td>${item.reorder_quantity}</td></tr>
            `).join("");
        emptyStockState.hidden = stockTableBody.innerHTML.length > 0;
        return;
    }
    const selectedMonth = stockMonthInput.value || getCurrentMonth();
    const monthRecords = getStockRecords().filter((record) => record.month === selectedMonth);
    const groupedRecords = new Map();
    monthRecords.forEach((record) => {
        const key = `${record.product}|${record.color}|${record.size}`.toLowerCase();
        const existing = groupedRecords.get(key) || { ...record, quantity: 0 };
        existing.quantity += Number(record.quantity) || 0;
        groupedRecords.set(key, existing);
    });
    const rankedRecords = [...groupedRecords.values()].sort((first, second) => second.quantity - first.quantity || first.product.localeCompare(second.product));
    const totalUnits = rankedRecords.reduce((total, record) => total + record.quantity, 0);
    stockSummary.textContent = `${totalUnits} unit${totalUnits === 1 ? "" : "s"} sold across ${rankedRecords.length} product option${rankedRecords.length === 1 ? "" : "s"}`;
    stockTableBody.innerHTML = rankedRecords.map((record, index) => `
        <tr><td>${index + 1}</td><td>${escapeHtml(record.product)}</td><td>${escapeHtml(record.color)}</td><td>${escapeHtml(record.size)}</td><td>-</td><td>${record.quantity}</td><td>-</td></tr>
    `).join("");
    emptyStockState.hidden = rankedRecords.length > 0;
}

function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

// Display a product message with image and colors
function displayProductMessage(productName, price, stock, imagePath, colors = [], sizes = [], sender = "bot") {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${sender}-message`;

    const messageContent = document.createElement("div");
    messageContent.className = "product-message";

    // Create image element
    const img = document.createElement("img");
    img.src = imagePath;
    img.alt = productName;
    img.className = "product-image";
    img.onerror = function () {
        // If image fails to load, show a placeholder
        this.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Crect fill='%23ddd' width='150' height='150'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='14' fill='%23999'%3EImage Not Found%3C/text%3E%3C/svg%3E";
    };

    // Create product details
    const details = document.createElement("div");
    details.className = "product-details";

    const selectedOptions = {
        color: "",
        size: ""
    };

    const selectionSummary = document.createElement("div");
    selectionSummary.className = "selection-summary";
    selectionSummary.textContent = "No options selected";

    const nameEl = document.createElement("div");
    nameEl.className = "product-name";
    nameEl.textContent = productName;

    const priceEl = document.createElement("div");
    priceEl.className = "product-price";
    priceEl.textContent = `💰 Price: ${price}`;

    const statusEl = document.createElement("div");
    statusEl.className = "product-status";
    if (stock) {
        statusEl.innerHTML = `<span class="in-stock">✅ In Stock</span>`;
    } else {
        statusEl.innerHTML = `<span class="out-of-stock">❌ Out of Stock</span>`;
    }

    details.appendChild(nameEl);
    details.appendChild(priceEl);
    details.appendChild(statusEl);

    // Add colors if available
    if (colors && colors.length > 0) {
        const colorsLabel = document.createElement("div");
        colorsLabel.className = "colors-label";
        colorsLabel.textContent = "Available Colors:";
        details.appendChild(colorsLabel);

        const colorsContainer = document.createElement("div");
        colorsContainer.className = "colors-container";

        colors.forEach(color => {
            const colorSwatch = document.createElement("button");
            colorSwatch.type = "button";
            colorSwatch.className = "color-swatch";
            colorSwatch.title = color;
            colorSwatch.setAttribute("aria-label", `Choose ${color} colour`);
            colorSwatch.style.backgroundColor = getColorHex(color);

            colorSwatch.addEventListener("click", () => {
                selectedOptions.color = color;
                colorsContainer.querySelectorAll(".color-swatch").forEach((option) => {
                    option.classList.remove("selected");
                });
                colorSwatch.classList.add("selected");
                updateSelectionSummary();
            });

            const colorLabel = document.createElement("span");
            colorLabel.className = "color-label";
            colorLabel.textContent = color;

            colorSwatch.appendChild(colorLabel);
            colorsContainer.appendChild(colorSwatch);
        });

        details.appendChild(colorsContainer);
    }

    // Add sizes if available
    if (sizes && sizes.length > 0) {
        const sizesLabel = document.createElement("div");
        sizesLabel.className = "sizes-label";
        sizesLabel.textContent = "Available Sizes:";
        details.appendChild(sizesLabel);

        const sizesContainer = document.createElement("div");
        sizesContainer.className = "sizes-container";

        sizes.forEach(size => {
            const sizeOption = document.createElement("button");
            sizeOption.type = "button";
            sizeOption.className = "size-option";
            sizeOption.textContent = size;
            sizeOption.setAttribute("aria-label", `Choose size ${size}`);
            sizeOption.addEventListener("click", () => {
                selectedOptions.size = size;
                sizesContainer.querySelectorAll(".size-option").forEach((option) => {
                    option.classList.remove("selected");
                });
                sizeOption.classList.add("selected");
                updateSelectionSummary();
            });
            sizesContainer.appendChild(sizeOption);
        });

        details.appendChild(sizesContainer);
    }

    function updateSelectionSummary() {
        const choices = [];
        if (selectedOptions.color) {
            choices.push(`Colour: ${selectedOptions.color}`);
        }
        if (selectedOptions.size) {
            choices.push(`Size: ${selectedOptions.size}`);
        }
        selectionSummary.textContent = choices.length > 0
            ? `Selected: ${choices.join(" | ")}`
            : "No options selected";
    }

    details.appendChild(selectionSummary);

    const purchaseButton = document.createElement("button");
    purchaseButton.type = "button";
    purchaseButton.className = "purchase-button";
    purchaseButton.textContent = stock
        ? "Purchase"
        : "Currently unavailable";
    purchaseButton.disabled = !stock;
    purchaseButton.addEventListener("click", () => {
        const missingOptions = [];
        if (colors.length > 0 && !selectedOptions.color) {
            missingOptions.push("a colour");
        }
        if (sizes.length > 0 && !selectedOptions.size) {
            missingOptions.push("a size");
        }

        if (missingOptions.length > 0) {
            displayMessage(
                `Please choose ${missingOptions.join(" and ")} before continuing with the purchase.`,
                "bot"
            );
            return;
        }

        const choices = [];
        if (selectedOptions.color) {
            choices.push(`colour: ${selectedOptions.color}`);
        }
        if (selectedOptions.size) {
            choices.push(`size: ${selectedOptions.size}`);
        }
        const selectedDetails = choices.length > 0
            ? ` (${choices.join(", ")})`
            : "";

        displayMessage(
            `A human StreetCode representative will assist you with purchasing the ${productName}${selectedDetails}. For your security, please share payment and personal details only with the representative through the contact details provided below`,
            "bot"
        );
        saveStockRecord(productName, selectedOptions.color || "Unspecified", selectedOptions.size || "One size", 1);
    });

    messageContent.appendChild(img);
    messageContent.appendChild(details);
    messageContent.appendChild(purchaseButton);
    messageDiv.appendChild(messageContent);
    chatWindow.appendChild(messageDiv);

    // Auto-scroll to the latest message
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Convert color name to hex code
function getColorHex(colorName) {
    const colorMap = {
        "Black": "#000000",
        "White": "#FFFFFF",
        "Navy": "#001F3F",
        "Red": "#FF4136",
        "Blue": "#0074D9",
        "Grey": "#808080",
        "Gray": "#AAAAAA",
        "Brown": "#8B4513",
        "Charcoal": "#36454F",
        "Cream": "#FFFDD0",
        "Beige": "#F5F5DC",
        "Olive": "#808000",
        "Green": "#2ECC40",
        "Khaki": "#F0E68C",
        "Burgundy": "#800020",
        "Tan": "#D2B48C",
        "Pink": "#FF69B4",
        "Yellow": "#FFDD00"
    };
    return colorMap[colorName] || "#CCCCCC";
}

// Handle user input
async function handleUserMessage() {
    const userText = userInput.value.trim();

    // Don't process empty messages
    if (userText === "") {
        return;
    }

    // Display user message
    displayMessage(userText, "user");

    // Clear input field
    userInput.value = "";
    conversation.push({ role: "user", content: userText });

    // Check if user wants to exit
    if (userText.toLowerCase() === "bye") {
        const randomByeMessage =
            byeMessages[Math.floor(Math.random() * byeMessages.length)];
        displayMessage(randomByeMessage, "bot");
        userInput.disabled = true;
        sendButton.disabled = true;
        return;
    }

    // Process the user's message
    const result = processChatInput(userText);

    // Check if result is a product or just text
    if (result.type === "product") {
        displayProductMessage(result.name, result.price, result.stock, result.image, result.colors, result.sizes);
        conversation.push({ role: "assistant", content: `Product: ${result.name}, price: ${result.price}, in stock: ${result.stock ? "yes" : "no"}.` });
    } else {
        const reply = await getLlmReply();
        displayMessage(reply || result.text, "bot");
        conversation.push({ role: "assistant", content: reply || result.text });
    }
}

async function getLlmReply() {
    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                messages: conversation,
                inventory: Object.entries(storeInventory).map(([name, item]) => ({
                    name: getProductType(name),
                    ...item,
                })),
            }),
        });
        if (!response.ok) {
            return "";
        }
        const data = await response.json();
        return typeof data.reply === "string" ? data.reply : "";
    } catch (error) {
        return "";
    }
}

// Extract product type from full item name (e.g., "Straata Graphic T-shirt" from "streetcode clothing Straata Graphic T-shirt")
function getProductType(itemName) {
    return itemName.replace(/^streetcode clothing\s+/i, "").trim();
}

// Find a colour explicitly mentioned in the customer's request
function getRequestedColor(input) {
    const colorNames = new Set([
        "Black", "White", "Navy", "Red", "Blue", "Grey", "Gray", "Brown",
        "Charcoal", "Cream", "Beige", "Olive", "Green", "Khaki", "Burgundy",
        "Tan", "Pink", "Yellow", "Purple", "Orange"
    ]);

    return [...colorNames].find((color) =>
        input.toLowerCase().includes(color.toLowerCase())
    );
}

// Process user input and generate bot response
function processChatInput(input) {
    const lowerInput = input.toLowerCase();

    // Check if the user is asking for an item
    for (const [itemName, itemData] of Object.entries(storeInventory)) {
        const productType = getProductType(itemName);
        const productLower = productType.toLowerCase();

        // Check if the user is asking about this specific item
        if (lowerInput.includes(productLower) || lowerInput.includes(productLower.split(" ")[0])) {
            const requestedColor = getRequestedColor(input);
            if (
                requestedColor &&
                !itemData.colors.some((color) => color.toLowerCase() === requestedColor.toLowerCase())
            ) {
                const randomUnavailableColorMessage =
                    unavailableColorMessages[
                    Math.floor(Math.random() * unavailableColorMessages.length)
                    ];
                return {
                    type: "text",
                    text: randomUnavailableColorMessage(requestedColor, productType),
                };
            }

            // Item found - return product object with image and colors
            return {
                type: "product",
                name: productType,
                price: itemData.price,
                stock: itemData.stock,
                image: itemData.image,
                colors: itemData.colors || [],
                sizes: itemData.sizes || []
            };
        }
    }

    // Check for common greetings or questions
    if (
        lowerInput.includes("hello") ||
        lowerInput.includes("hi") ||
        lowerInput.includes("hey")
    ) {
        return { type: "text", text: "Hi there! Welcome to Streetcode Clothing! How can I help you today?" };
    }

    if (lowerInput.includes("do you have") || lowerInput.includes("i am looking for")) {
        const items = Object.keys(storeInventory)
            .map((item) => `${getProductType(item)} (${storeInventory[item].price})`)
            .join(", ");
        return { type: "text", text: `We carry: ${items}. What interests you?` };
    }

    if (lowerInput.includes("help") || lowerInput.includes("how")) {
        return { type: "text", text: "You can ask me about specific items like T-shirts, pants, hoodies, and more. I'll tell you if they're in stock and their price!" };
    }

    if (lowerInput.includes("price") || lowerInput.includes("cost")) {
        return { type: "text", text: "Just ask me about a specific item (like 'how much is a hoodie?') and I'll tell you the price!" };
    }

    if (lowerInput.includes("thank you") || lowerInput.includes("appreciate")) {
        return { type: "text", text: "Thanks for shopping with Streetcode Clothing! Feel free to visit our website for more products at www.streetcodeclothing.co.za. Goodbye! 👋" };
    }

    else if (lowerInput.includes("stock") || lowerInput.includes("available")) {
        return { type: "text", text: "That product is out of stock unfortunately." };
    }

    // Unknown input - provide a random unknown message
    const randomUnknownMessage =
        unknownInputMessages[
        Math.floor(Math.random() * unknownInputMessages.length)
        ];
    return { type: "text", text: randomUnknownMessage };
}

// Start the chatbot when the page loads
window.addEventListener("DOMContentLoaded", initializeChatbot);
