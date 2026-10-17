const app = document.getElementById("app");
const tabs = document.querySelectorAll("[data-tab]");

const sampleActivities = [
    { start: 1, finish: 3 },
    { start: 2, finish: 5 },
    { start: 4, finish: 6 },
    { start: 6, finish: 8 },
    { start: 5, finish: 9 },
    { start: 8, finish: 10 }
];

let activities = [...sampleActivities];
let steps = [];
let currentStep = 0;
let timer = null;
let speed = 1500;
let status = "ready";

function stopTimer() {
    if (timer !== null) {
        clearInterval(timer);
        timer = null;
    }
}

function createSteps() {
    const sorted = activities
        .map((a, i) => ({
            ...a,
            name: `A${i + 1}`
        }))
        .sort((a, b) =>
            a.finish - b.finish || a.start - b.start
        );

    const result = [{
        message: "Activities are sorted by finishing time. We will select compatible activities.",
        selected: [],
        current: null
    }];

    let lastFinish = -Infinity;
    const selected = [];

    for (const activity of sorted) {
        const accepted = activity.start >= lastFinish;

        if (accepted) {
            selected.push(activity.name);
            lastFinish = activity.finish;
        }

        result.push({
            message: accepted
                ? `${activity.name} (${activity.start}, ${activity.finish}) is SELECTED because it starts at or after the previous finish time.`
                : `${activity.name} (${activity.start}, ${activity.finish}) is REJECTED because it overlaps the previous selected activity.`,
            selected: [...selected],
            current: activity.name
        });
    }

    result.push({
        message: `Completed! ${selected.length} activities selected: ${selected.join(", ")}.`,
        selected: [...selected],
        current: null
    });

    return result;
}

function renderActivity() {
    const step = steps[currentStep];

    app.innerHTML = `
        <h2>Activity Selection Simulator</h2>
        <p>Find the maximum number of non-overlapping activities.</p>

        <div class="sim-info">
            <strong>Greedy rule:</strong>
            Always choose the compatible activity that finishes earliest.
        </div>

        <label for="activityInput">
            Enter start and finish times (one activity per line):
        </label>

        <textarea id="activityInput" rows="6"
            placeholder="1,3&#10;2,5&#10;4,6">${activities
                .map(a => `${a.start},${a.finish}`).join("\n")}</textarea>

        <div class="input-help">
            Example: 1,3 means start time 1 and finish time 3.
        </div>

        <div class="controls input-controls">
            <button id="loadExample">Load Example</button>
            <button id="runSimulation">Run Simulation</button>
        </div>

        <p id="errorMessage" class="error-message" role="alert"></p>

        <h3>Activity Timeline</h3>

        <div class="timeline">
            ${activities.map((a, i) => {
                const name = `A${i + 1}`;
                const chosen = step.selected.includes(name);
                const active = step.current === name;
                const rejected = active && !chosen;

                return `
                    <div class="activity-row">
                        <span class="activity-label">${name}</span>
                        <div class="activity-track">
                            <div class="activity-bar
                                ${chosen ? "selected" : ""}
                                ${active ? "current" : ""}
                                ${rejected ? "rejected" : ""}"
                                style="left:${a.start * 10}%;
                                width:${(a.finish - a.start) * 10}%">
                                ${a.start}–${a.finish}
                            </div>
                        </div>
                    </div>
                `;
            }).join("")}
        </div>

        <div class="step-card">
            <p><strong>Step ${currentStep + 1} of ${steps.length}</strong></p>
            <p>${step.message}</p>
            <p><strong>Selected:</strong>
                ${step.selected.join(", ") || "None yet"}
            </p>
            <p><strong>Status:</strong> ${status}</p>
        </div>

        <div class="speed-control">
            <label for="speed">Animation speed:</label>
            <select id="speed">
                <option value="2500" ${speed === 2500 ? "selected" : ""}>Slow</option>
                <option value="1500" ${speed === 1500 ? "selected" : ""}>Normal</option>
                <option value="600" ${speed === 600 ? "selected" : ""}>Fast</option>
            </select>
        </div>

        <div class="controls">
            <button id="play" ${timer !== null || currentStep === steps.length - 1 ? "disabled" : ""}>▶ Play</button>
            <button id="pause" ${timer === null ? "disabled" : ""}>⏸ Pause</button>
            <button id="resume" ${timer !== null || currentStep === steps.length - 1 ? "disabled" : ""}>▶ Resume</button>
            <button id="reset">↻ Reset</button>
        </div>

        <h3>Algorithm Complexity</h3>
        <p>Time: O(n log n), including sorting.</p>
        <p>Selection after sorting: O(n).</p>
    `;

    document.getElementById("loadExample").onclick = () => {
        stopTimer();
        activities = [...sampleActivities];
        currentStep = 0;
        status = "ready";
        steps = createSteps();
        renderActivity();
    };

    document.getElementById("runSimulation").onclick = () => {
        stopTimer();

        const text = document.getElementById("activityInput").value.trim();
        const error = document.getElementById("errorMessage");

        if (!text) {
            error.textContent = "Please enter at least one activity.";
            return;
        }

        const lines = text.split(/\n/);
        const parsed = [];

        for (let i = 0; i < lines.length; i++) {
            const parts = lines[i].split(",").map(v => v.trim());

            if (parts.length !== 2 || parts.some(v => v === "")) {
                error.textContent = `Line ${i + 1}: enter values as start,finish.`;
                return;
            }

            const [start, finish] = parts.map(Number);

            if (!Number.isFinite(start) || !Number.isFinite(finish) ||
                finish <= start) {
                error.textContent = `Line ${i + 1}: finish must be greater than start, using valid numbers.`;
                return;
            }

            parsed.push({ start, finish });
        }

        activities = parsed;
        currentStep = 0;
        status = "ready";
        steps = createSteps();
        renderActivity();
    };

    document.getElementById("play").onclick = playSimulation;
    document.getElementById("pause").onclick = pauseSimulation;
    document.getElementById("resume").onclick = playSimulation;
    document.getElementById("reset").onclick = resetSimulation;

    document.getElementById("speed").onchange = event => {
        speed = Number(event.target.value);

        if (timer !== null) {
            stopTimer();
            playSimulation();
        }
    };
}

function playSimulation() {
    if (timer !== null || currentStep >= steps.length - 1) return;

    status = "playing";
    renderActivity();

    timer = setInterval(() => {
        if (currentStep < steps.length - 1) {
            currentStep++;
        }

        if (currentStep >= steps.length - 1) {
            stopTimer();
            status = "completed";
            renderActivity();
            return;
        }

        renderActivity();
    }, speed);
}

function pauseSimulation() {
    if (timer === null) return;

    stopTimer();
    status = "paused";
    renderActivity();
}

function resetSimulation() {
    stopTimer();
    currentStep = 0;
    status = "ready";
    steps = createSteps();
    renderActivity();
}
function showWelcome() {
    stopTimer();

    app.innerHTML = `
        <h2>Welcome to Greedy Algorithm Simulator!</h2>
        <p>Choose an algorithm above to explore its working.</p>
        <p>Try your own input or use the provided example.</p>
    `;
}

tabs.forEach(tab => {
    tab.addEventListener("click", () => {
        stopTimer();
        stopKnapsackTimer();
        stopHuffmanTimer();

        tabs.forEach(item => item.classList.remove("active"));
        tab.classList.add("active");

        if (tab.dataset.tab === "activity") {
            steps = createSteps();
            currentStep = 0;
            status = "ready";
            renderActivity();
        } else if (tab.dataset.tab === "knapsack") {
            if (knapsackSteps.length === 0) {
                knapsackSteps = createKnapsackSteps();
            }
            renderKnapsack();
        } else if (tab.dataset.tab === "huffman") {
            if (huffmanSteps.length === 0) {
                huffmanSteps = buildHuffmanSteps();
            }
            renderHuffman();
        }
    });
});

steps = createSteps();
showWelcome();

const sampleItems = [
    { weight: 10, value: 60 },
    { weight: 20, value: 100 },
    { weight: 30, value: 120 }
];

let items = [...sampleItems];
let capacity = 50;
let knapsackSteps = [];
let knapsackStep = 0;
let knapsackTimer = null;
let knapsackSpeed = 1500;
let knapsackStatus = "ready";

function stopKnapsackTimer() {
    if (knapsackTimer !== null) {
        clearInterval(knapsackTimer);
        knapsackTimer = null;
    }
}

function createKnapsackSteps() {
    const sorted = items
        .map((item, index) => ({
            ...item,
            name: `Item ${index + 1}`,
            ratio: item.value / item.weight
        }))
        .sort((a, b) => b.ratio - a.ratio);

    let remaining = capacity;
    let totalValue = 0;

    const result = [{
        message: "Items are sorted by value-to-weight ratio, highest first.",
        chosen: [],
        totalValue: 0,
        remaining
    }];

    const chosen = [];

    for (const item of sorted) {
        if (remaining <= 0) break;

        const fraction = Math.min(1, remaining / item.weight);
        const usedWeight = item.weight * fraction;
        const gainedValue = item.value * fraction;

        remaining -= usedWeight;
        totalValue += gainedValue;

        chosen.push({
            name: item.name,
            fraction,
            usedWeight,
            gainedValue
        });

        result.push({
            message: `${item.name}: take ${(fraction * 100).toFixed(1)}% of the item. Value gained: ${gainedValue.toFixed(2)}.`,
            chosen: [...chosen],
            totalValue,
            remaining
        });
    }

    result.push({
        message: "Knapsack completed!",
        chosen: [...chosen],
        totalValue,
        remaining
    });

    return result;
}

function renderKnapsack() {
    const step = knapsackSteps[knapsackStep];

    app.innerHTML = `
        <h2>Fractional Knapsack Simulator</h2>
        <p>Maximize the total value without exceeding the bag's capacity.</p>

        <div class="sim-info">
            <strong>Greedy rule:</strong>
            Choose items in descending order of value-to-weight ratio.
            Fractions of items are allowed.
        </div>

        <label for="capacityInput">Knapsack capacity:</label>
        <input id="capacityInput" type="number" min="0.01"
            step="any" value="${capacity}">

        <label for="itemInput">
            Enter weight and value (one item per line):
        </label>

        <textarea id="itemInput" rows="5">${items
            .map(item => `${item.weight},${item.value}`).join("\n")}</textarea>

        <p class="input-help">Example: 10,60 means weight 10 and value 60.</p>

        <div class="controls">
            <button id="knapsackExample">Load Example</button>
            <button id="knapsackRun">Run Simulation</button>
        </div>

        <p id="knapsackError" class="error-message"></p>

        <h3>Items sorted by value-to-weight ratio</h3>
        <div class="knapsack-items">
            ${items.map((item, i) => `
                <div class="knapsack-item">
                    <strong>Item ${i + 1}</strong>
                    <p>Weight: ${item.weight}</p>
                    <p>Value: ${item.value}</p>
                    <p>Ratio: ${(item.value / item.weight).toFixed(2)}</p>
                </div>
            `).join("")}
        </div>

        <div class="step-card">
            <p><strong>Step ${knapsackStep + 1} of ${knapsackSteps.length}</strong></p>
            <p>${step.message}</p>
            <p><strong>Total value:</strong> ${step.totalValue.toFixed(2)}</p>
            <p><strong>Remaining capacity:</strong> ${step.remaining.toFixed(2)}</p>
            <p><strong>Status:</strong> ${knapsackStatus}</p>
            <h4>Selected items</h4>
            ${step.chosen.length
                ? step.chosen.map(item => `
                    <p>${item.name}: ${(item.fraction * 100).toFixed(1)}%
                    | Weight used: ${item.usedWeight.toFixed(2)}
                    | Value gained: ${item.gainedValue.toFixed(2)}</p>
                `).join("")
                : "<p>No items selected yet.</p>"}
        </div>

        <div class="speed-control">
            <label for="knapsackSpeed">Animation speed:</label>
            <select id="knapsackSpeed">
                <option value="2500" ${knapsackSpeed === 2500 ? "selected" : ""}>Slow</option>
                <option value="1500" ${knapsackSpeed === 1500 ? "selected" : ""}>Normal</option>
                <option value="600" ${knapsackSpeed === 600 ? "selected" : ""}>Fast</option>
            </select>
        </div>

        <div class="controls">
            <button id="knapsackPlay">▶ Play</button>
            <button id="knapsackPause">⏸ Pause</button>
            <button id="knapsackResume">▶ Resume</button>
            <button id="knapsackReset">↻ Reset</button>
        </div>

        <h3>Algorithm Complexity</h3>
        <p>Time: O(n log n), due to sorting items by ratio.</p>
        <p>Space: O(n), for storing items and simulation steps.</p>
    `;

    document.getElementById("knapsackExample").onclick = () => {
        stopKnapsackTimer();
        items = [...sampleItems];
        capacity = 50;
        knapsackStep = 0;
        knapsackStatus = "ready";
        knapsackSteps = createKnapsackSteps();
        renderKnapsack();
    };

    document.getElementById("knapsackRun").onclick = () => {
        stopKnapsackTimer();

        const error = document.getElementById("knapsackError");
        const newCapacity = Number(
            document.getElementById("capacityInput").value
        );
        const text = document.getElementById("itemInput").value.trim();

        if (!Number.isFinite(newCapacity) || newCapacity <= 0) {
            error.textContent = "Capacity must be greater than zero.";
            return;
        }

        if (!text) {
            error.textContent = "Enter at least one item.";
            return;
        }

        const parsed = [];
        const lines = text.split("\n");

        for (let i = 0; i < lines.length; i++) {
            const parts = lines[i].split(",").map(v => v.trim());

            if (parts.length !== 2 || parts.some(v => v === "")) {
                error.textContent = `Line ${i + 1}: use weight,value format.`;
                return;
            }

            const [weight, value] = parts.map(Number);

            if (!Number.isFinite(weight) || !Number.isFinite(value) ||
                weight <= 0 || value < 0) {
                error.textContent =
                    `Line ${i + 1}: weight must be positive and value cannot be negative.`;
                return;
            }

            parsed.push({ weight, value });
        }

        capacity = newCapacity;
        items = parsed;
        knapsackStep = 0;
        knapsackStatus = "ready";
        knapsackSteps = createKnapsackSteps();
        renderKnapsack();
    };

    document.getElementById("knapsackPlay").onclick = playKnapsack;
    document.getElementById("knapsackResume").onclick = playKnapsack;

    document.getElementById("knapsackPause").onclick = () => {
        stopKnapsackTimer();
        knapsackStatus = "paused";
        renderKnapsack();
    };

    document.getElementById("knapsackReset").onclick = () => {
        stopKnapsackTimer();
        knapsackStep = 0;
        knapsackStatus = "ready";
        knapsackSteps = createKnapsackSteps();
        renderKnapsack();
    };

    document.getElementById("knapsackSpeed").onchange = event => {
        knapsackSpeed = Number(event.target.value);

        if (knapsackTimer !== null) {
            stopKnapsackTimer();
            playKnapsack();
        }
    };
}
function playKnapsack() {
    if (knapsackTimer !== null ||
        knapsackStep >= knapsackSteps.length - 1) return;

    knapsackStatus = "playing";
    renderKnapsack();

    knapsackTimer = setInterval(() => {
        knapsackStep++;

        if (knapsackStep >= knapsackSteps.length - 1) {
            stopKnapsackTimer();
            knapsackStatus = "completed";
        }

        renderKnapsack();
    }, knapsackSpeed);
}

knapsackSteps = createKnapsackSteps();

const sampleFrequencies = [
    { char: "A", freq: 5 },
    { char: "B", freq: 9 },
    { char: "C", freq: 12 },
    { char: "D", freq: 13 },
    { char: "E", freq: 16 },
    { char: "F", freq: 45 }
];

let frequencies = [...sampleFrequencies];
let huffmanSteps = [];
let huffmanStep = 0;
let huffmanTimer = null;
let huffmanSpeed = 1500;
let huffmanStatus = "ready";

function stopHuffmanTimer() {
    if (huffmanTimer !== null) {
        clearInterval(huffmanTimer);
        huffmanTimer = null;
    }
}

function buildHuffmanSteps() {
    const queue = frequencies.map((item, index) => ({
        char: item.char,
        freq: item.freq,
        chars: item.char,
        left: null,
        right: null,
        id: index
    }));

    const result = [{
        message: "Start with one leaf node for each character. Nodes are ordered by frequency, then by their original ID when frequencies tie.",
        queue: queue.map(node => ({
            chars: node.chars,
            freq: node.freq
        })),
        merged: null
    }];

    let nextId = queue.length;

    while (queue.length > 1) {
        // Stable tie-breaking: frequency first, then node ID.
        queue.sort((a, b) =>
            a.freq - b.freq || a.id - b.id
        );

        // The two lowest-frequency nodes are always selected.
        const left = queue.shift();
        const right = queue.shift();

        const parent = {
            char: null,
            freq: left.freq + right.freq,
            chars: left.chars + right.chars,
            left: left,
            right: right,
            id: nextId++
        };

        queue.push(parent);

        result.push({
            message: `Merge ${left.chars} (${left.freq}) and ${right.chars} (${right.freq}) into a parent node with frequency ${parent.freq}.`,
            queue: queue.map(node => ({
                chars: node.chars,
                freq: node.freq
            })),
            merged: {
                left: left.chars,
                right: right.chars,
                freq: parent.freq
            },
            tree: parent
        });
    }

    const root = queue[0];
    const codes = {};

    function generateCodes(node, code = "") {
        if (!node.left && !node.right) {
            codes[node.char] = code || "0";
            return;
        }

        // Left branch = 0; right branch = 1.
        generateCodes(node.left, code + "0");
        generateCodes(node.right, code + "1");
    }

    generateCodes(root);

    const totalBits = frequencies.reduce(
        (sum, item) =>
            sum + item.freq * codes[item.char].length,
        0
    );

    result.push({
        message: "Huffman tree completed! The final codes are ready.",
        queue: [{ chars: root.chars, freq: root.freq }],
        merged: null,
        tree: root,
        codes: codes,
        totalBits: totalBits
    });

    return result;
}

function renderHuffman() {
    if (huffmanSteps.length === 0) {
        huffmanSteps = buildHuffmanSteps();
    }

    const step = huffmanSteps[huffmanStep];
    const treeRoot = step.tree || huffmanSteps
    .slice(0, huffmanStep + 1)
    .reverse()
    .find(item => item.tree)?.tree;
    app.innerHTML = `
        <h2>Huffman Coding Simulator</h2>
        <p>Build variable-length binary codes using character frequencies.</p>

        <div class="sim-info">
            <strong>Greedy rule:</strong>
            Repeatedly merge the two nodes with the smallest frequencies.
        </div>

        <label for="huffmanInput">
            Enter character and frequency (one per line):
        </label>

        <textarea id="huffmanInput" rows="6">${frequencies
            .map(item => `${item.char},${item.freq}`).join("\n")}</textarea>

        <p class="input-help">Example: A,5 means character A has frequency 5.</p>

        <div class="controls">
            <button id="huffmanExample">Load Example</button>
            <button id="huffmanRun">Run Simulation</button>
        </div>

        <p id="huffmanError" class="error-message"></p>
        <h3>Huffman Tree</h3>
<div id="huffmanTree" class="huffman-tree"></div>

        <h3>Current Nodes</h3>
        <div class="knapsack-items">
            ${step.queue.map(node => `
                <div class="knapsack-item">
                    <strong>${node.chars}</strong>
                    <p>Frequency: ${node.freq}</p>
                </div>
            `).join("")}
        </div>

        <div class="step-card">
            <p><strong>Step ${huffmanStep + 1} of ${huffmanSteps.length}</strong></p>
            <p>${step.message}</p>
            <p><strong>Status:</strong> ${huffmanStatus}</p>
        </div>

        ${step.codes ? `
            <h3>Final Huffman Codes</h3>
            <table>
                <thead>
                    <tr>
                        <th>Character</th>
                        <th>Frequency</th>
                        <th>Code</th>
                    </tr>
                </thead>
                <tbody>
                    ${frequencies.map(item => `
                        <tr>
                            <td>${item.char}</td>
                            <td>${item.freq}</td>
                            <td><code>${step.codes[item.char]}</code></td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
            <h3>Total Encoded Bits: ${step.totalBits}</h3>
        ` : ""}

        <div class="speed-control">
            <label for="huffmanSpeed">Animation speed:</label>
            <select id="huffmanSpeed">
                <option value="2500" ${huffmanSpeed === 2500 ? "selected" : ""}>Slow</option>
                <option value="1500" ${huffmanSpeed === 1500 ? "selected" : ""}>Normal</option>
                <option value="600" ${huffmanSpeed === 600 ? "selected" : ""}>Fast</option>
            </select>
        </div>

        <div class="controls">
            <button id="huffmanPlay">▶ Play</button>
            <button id="huffmanPause">⏸ Pause</button>
            <button id="huffmanResume">▶ Resume</button>
            <button id="huffmanNext">⏭ Next Step</button>
            <button id="huffmanReset">↻ Reset</button>
        </div>

        <h3>Algorithm Complexity</h3>
        <p>Time: O(n log n) with a priority queue.</p>
        <p>Space: O(n) for the Huffman tree.</p>
    `;

    document.getElementById("huffmanExample").onclick = () => {
        stopHuffmanTimer();
        frequencies = [...sampleFrequencies];
        huffmanStep = 0;
        huffmanStatus = "ready";
        huffmanSteps = buildHuffmanSteps();
        renderHuffman();
    };

    document.getElementById("huffmanRun").onclick = () => {
        stopHuffmanTimer();

        const error = document.getElementById("huffmanError");
        const text = document.getElementById("huffmanInput").value.trim();

        if (!text) {
            error.textContent = "Enter at least two characters.";
            return;
        }

        const parsed = [];
        const lines = text.split("\n");
        const seen = new Set();

        for (let i = 0; i < lines.length; i++) {
            const parts = lines[i].split(",").map(value => value.trim());

            if (parts.length !== 2 || parts[0].length !== 1) {
                error.textContent =
                    `Line ${i + 1}: use one character and its frequency, like A,5.`;
                return;
            }

            const char = parts[0];
            const freq = Number(parts[1]);
            if (seen.has(char)) {
                error.textContent = `Character "${char}" is repeated.`;
                return;
            }

            if (!Number.isFinite(freq) || freq <= 0) {
                error.textContent =
                    `Line ${i + 1}: frequency must be a positive number.`;
                return;
            }

            seen.add(char);
            parsed.push({ char, freq });
        }

        if (parsed.length < 2) {
            error.textContent = "Enter at least two different characters.";
            return;
        }

        frequencies = parsed;
        huffmanStep = 0;
        huffmanStatus = "ready";
        huffmanSteps = buildHuffmanSteps();
        renderHuffman();
    };
        document.getElementById("huffmanPlay").onclick = playHuffman;
    document.getElementById("huffmanResume").onclick = playHuffman;

    document.getElementById("huffmanPause").onclick = () => {
        if (huffmanTimer !== null) {
            stopHuffmanTimer();
            huffmanStatus = "paused";
            renderHuffman();
        }
    };
    
document.getElementById("huffmanNext").onclick = () => {
    stopHuffmanTimer();

    if (huffmanStep < huffmanSteps.length - 1) {
        huffmanStep++;
        huffmanStatus = "paused";
        renderHuffman();
    }
};


    document.getElementById("huffmanReset").onclick = () => {
        stopHuffmanTimer();
        huffmanStep = 0;
        huffmanStatus = "ready";
        huffmanSteps = buildHuffmanSteps();
        renderHuffman();
    };

    document.getElementById("huffmanSpeed").onchange = event => {
        huffmanSpeed = Number(event.target.value);

            
    };
    if (treeRoot) {
        drawHuffmanTree(treeRoot);
    }
}


function playHuffman() {
    if (huffmanTimer !== null ||
        huffmanStep >= huffmanSteps.length - 1) return;

    huffmanStatus = "playing";
    renderHuffman();

    huffmanTimer = setInterval(() => {
        huffmanStep++;

        if (huffmanStep >= huffmanSteps.length - 1) {
            stopHuffmanTimer();
            huffmanStatus = "completed";
        }

        renderHuffman();
    }, huffmanSpeed);
}

huffmanSteps = buildHuffmanSteps();
function drawHuffmanTree(root) {
    const container = document.getElementById("huffmanTree");

    if (!container || !root) return;

    const width = 700;
    const levelGap = 75;
    const nodeRadius = 22;
    const positions = [];
    let leafIndex = 0;

    function calculatePositions(node, depth = 0) {
        if (!node.left && !node.right) {
            positions.push({
                node,
                x: 0,
                y: depth * levelGap
            });

            return leafIndex++;
        }

        const leftIndex = calculatePositions(node.left, depth + 1);
        const rightIndex = calculatePositions(node.right, depth + 1);

        return (leftIndex + rightIndex) / 2;
    }

    positions.length = 0;
    leafIndex = 0;

    function layout(node, depth = 0) {
        if (!node.left && !node.right) {
            const x = leafIndex * 90;
            leafIndex++;

            positions.push({
                node,
                x,
                y: depth * levelGap
            });

            return x;
        }

        const leftX = layout(node.left, depth + 1);
        const rightX = layout(node.right, depth + 1);
        const x = (leftX + rightX) / 2;

        positions.push({
            node,
            x,
            y: depth * levelGap
        });

        return x;
    }

    layout(root);

    const minX = Math.min(...positions.map(p => p.x));
    const maxX = Math.max(...positions.map(p => p.x));
    const maxY = Math.max(...positions.map(p => p.y));
    const padding = 45;
    const svgWidth = Math.max(width, maxX - minX + padding * 2);
    const svgHeight = maxY + padding * 2;

    positions.forEach(p => {
        p.x = p.x - minX + padding;
        p.y = p.y + padding;
    });

    const byNode = new Map(positions.map(p => [p.node, p]));

    let edges = "";

    positions.forEach(p => {
        const node = p.node;

        for (const side of ["left", "right"]) {
            if (node[side]) {
                const child = byNode.get(node[side]);
                const label = side === "left" ? "0" : "1";

                edges += `
                    <line x1="${p.x}" y1="${p.y}"
                        x2="${child.x}" y2="${child.y}"
                        stroke="currentColor" stroke-width="2" />
                    <text x="${(p.x + child.x) / 2}"
                        y="${(p.y + child.y) / 2 - 5}"
                        text-anchor="middle" font-size="14"
                        fill="currentColor">${label}</text>
                `;
            }
        }
    });

    let nodes = "";

    positions.forEach(p => {
        const node = p.node;
        const isLeaf = !node.left && !node.right;
        const label = isLeaf ? node.char : node.freq;

        nodes += `
            <circle cx="${p.x}" cy="${p.y}"
                r="${nodeRadius}" fill="#dbeafe"
                stroke="#2563eb" stroke-width="2" />
            <text x="${p.x}" y="${p.y + 5}"
                text-anchor="middle" font-size="13"
                font-weight="bold" fill="#1e3a8a">${label}</text>
            ${isLeaf ? `
                <text x="${p.x}" y="${p.y + 38}"
                    text-anchor="middle" font-size="12"
                    fill="currentColor">Freq: ${node.freq}</text>
            ` : ""}
        `;
    });

    container.innerHTML = `
        <div style="overflow-x:auto">
            <svg xmlns="http://www.w3.org/2000/svg"
                width="${svgWidth}" height="${svgHeight}"
                viewBox="0 0 ${svgWidth} ${svgHeight}">
                ${edges}
                ${nodes}
            </svg>
        </div>
    `;
}