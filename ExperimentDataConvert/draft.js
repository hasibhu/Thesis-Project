


const fs = require('fs');

// === Read Demographic Data ===
const filePathDemographic = './results_data/demographicData/data.txt';
let inputStrDemographic = fs.readFileSync(filePathDemographic, 'utf8').trim();

// Remove leading "{}" and trailing semicolon if present
inputStrDemographic = inputStrDemographic.replace(/^\s*\{\}\s*/, '').replace(/;\s*$/, '');

// Extract all JSON-like blocks
const matches = inputStrDemographic.match(/\{[^}]+\}/g);

if (!matches || matches.length === 0) {
    console.error("❌ No valid demographic data found");
    process.exit(1);
}

let fullData = {};
for (const block of matches) {
    try {
        const parsed = JSON.parse(block);
        // Merge into fullData (later blocks override earlier ones)
        fullData = { ...fullData, ...parsed };
    } catch (err) {
        console.warn("⚠️ Skipping invalid block:", err.message);
    }
}

// Build filtered demographic data (standardized ID column)
let filteredData = {
    consent2: Array.isArray(fullData.consent2) ? fullData.consent2[0] : fullData.consent2 || '',
    ID: fullData["Participant Nr"] || fullData["Prolific ID"] || fullData["PROLIFIC_PID"] || '',
    Age: fullData["Age"] || '',
    gender:
        (Array.isArray(fullData.gender) ? fullData.gender[0] : fullData.gender) ||
        (Array.isArray(fullData.Gender) ? fullData.Gender[0] : fullData.Gender) ||
        ''
};

// === Read Experimental Data ===
const filePathExperiment = './results_data/experimentData/data.txt';
const inputStrExperiment = fs.readFileSync(filePathExperiment, 'utf8').trim();

// Split into blocks
const blocks = inputStrExperiment.split('$').filter(b => b.trim() !== ''); // remove empty blocks

// Insert demographic data at the beginning
const demoStr = `Consent:${filteredData["consent2"]}; ID:${filteredData["ID"]}; Age:${filteredData["Age"]}; Gender:${filteredData["gender"]}`;
blocks.unshift(demoStr);

// Store all unique column headers
let allColumns = new Set();

// === Define keys that should have linked item numbers ===
const specialKeys = ['choiceAversion1', 'choiceAversion2', 'freeWillScale1'];

// Parse each block into an object
const parsedData = blocks.map(block => {
    let row = {};
    let itemNumber = null;

    block.split(';').forEach(chunk => {
        let splitIndex = chunk.indexOf(':');
        if (splitIndex !== -1) {
            let key = chunk.substring(0, splitIndex).trim();
            let value = chunk.substring(splitIndex + 1).trim();

            if (key === 'itemNumber') {
                itemNumber = value;
            }

            if (specialKeys.includes(key)) {
                row[key] = value;
                const itemKey = `${key}ItemNumber`;
                row[itemKey] = itemNumber || '';
                allColumns.add(itemKey);
            } else {
                row[key] = value;
            }

            allColumns.add(key);
        }
    });

    return row;
});

// Convert column set to array
const columns = Array.from(allColumns).filter(col => col !== 'itemNumber');

// Create CSV content
let csvContent = columns.join(',') + '\n'; // Header row
parsedData.forEach(row => {
    let rowValues = columns.map(col => row[col] || '');
    csvContent += rowValues.join(',') + '\n';
});

// Write to CSV file
const outputFilePath = './01_f_fwb.csv';
fs.writeFileSync(outputFilePath, csvContent.trim(), 'utf8');
console.log(`✅ File saved successfully as ${outputFilePath}`);

























// current data conversion 

const fs = require('fs');

/* ================================
   READ DEMOGRAPHIC DATA
================================ */

const filePathDemographic = './results_data/demographicData/data.txt';
let inputStrDemographic = fs.readFileSync(filePathDemographic, 'utf8').trim();

// Remove leading "{}" and trailing semicolon if present
inputStrDemographic = inputStrDemographic
    .replace(/^\s*\{\}\s*/, '')
    .replace(/;\s*$/, '');

// Extract JSON blocks
const matches = inputStrDemographic.match(/\{[^}]+\}/g);

if (!matches || matches.length === 0) {
    console.error("❌ No valid demographic data found");
    process.exit(1);
}

let fullData = {};
for (const block of matches) {
    try {
        const parsed = JSON.parse(block);
        fullData = { ...fullData, ...parsed };
    } catch (err) {
        console.warn("⚠️ Skipping invalid demographic block");
    }
}

// Standard demographic row
const demographicRow = {
    ID:
        fullData["Participant Nr"] ||
        fullData["Prolific ID"] ||
        fullData["PROLIFIC_PID"] ||
        '',
    Age: fullData["Age"] || '',
    Gender:
        (Array.isArray(fullData.gender) ? fullData.gender[0] : fullData.gender) ||
        (Array.isArray(fullData.Gender) ? fullData.Gender[0] : fullData.Gender) ||
        ''
};

/* ================================
   READ EXPERIMENT DATA (JSON ARRAY)
================================ */

const filePathExperiment = './results_data/experimentData/data.txt';
let inputStrExperiment = fs.readFileSync(filePathExperiment, 'utf8').trim();

// Fix malformed JSON that starts with "-["
if (inputStrExperiment.startsWith('-[')) {
    inputStrExperiment = inputStrExperiment.substring(1);
}

let trials;
try {
    trials = JSON.parse(inputStrExperiment);
} catch (err) {
    console.error("❌ Experimental data is not valid JSON:", err.message);
    process.exit(1);
}

if (!Array.isArray(trials)) {
    console.error("❌ Expected an array of trial objects");
    process.exit(1);
}

/* ================================
   MERGE + CLEAN TRIALS
================================ */

const mergedRows = trials
    .filter(t => t.task_part === "experimental_trial") // keep real trials
    .map(trial => {
        const { task_part, ...cleanTrial } = trial; // remove task_part
        return { ...demographicRow, ...cleanTrial };
    });

if (mergedRows.length === 0) {
    console.error("❌ No experimental trials found");
    process.exit(1);
}

/* ================================
   BUILD CSV
================================ */

// Collect all column names
const allColumns = new Set();
mergedRows.forEach(row => {
    Object.keys(row).forEach(key => allColumns.add(key));
});

const columns = Array.from(allColumns);

// Convert to CSV string
let csvContent = columns.join(',') + '\n';

mergedRows.forEach(row => {
    const values = columns.map(col => {
        let value = row[col] ?? '';

        // Escape commas and quotes
        if (typeof value === 'string') {
            value = value.replace(/"/g, '""');
            if (value.includes(',') || value.includes('\n')) {
                value = `"${value}"`;
            }
        }

        return value;
    });

    csvContent += values.join(',') + '\n';
});

/* ================================
   SAVE FILE
================================ */

const outputFilePath = './01_f_fwb.csv';
fs.writeFileSync(outputFilePath, csvContent.trim(), 'utf8');

console.log(`✅ CSV saved → ${outputFilePath}`);






const fs = require('fs');

/* ================================
   READ DEMOGRAPHIC DATA
================================ */

const filePathDemographic = './results_data/demographicData/data.txt';
let inputStrDemographic = fs.readFileSync(filePathDemographic, 'utf8').trim();

inputStrDemographic = inputStrDemographic
    .replace(/^\s*\{\}\s*/, '')
    .replace(/;\s*$/, '');

const matches = inputStrDemographic.match(/\{[^}]+\}/g);

if (!matches) {
    console.error("❌ No valid demographic data found");
    process.exit(1);
}

let fullData = {};
for (const block of matches) {
    try {
        const parsed = JSON.parse(block);
        fullData = { ...fullData, ...parsed };
    } catch {}
}

const demographicRow = {
    ID:
        fullData["Participant Nr"] ||
        fullData["Prolific ID"] ||
        fullData["PROLIFIC_PID"] ||
        '',
    Age: fullData["Age"] || '',
    Gender:
        (Array.isArray(fullData.gender) ? fullData.gender[0] : fullData.gender) ||
        (Array.isArray(fullData.Gender) ? fullData.Gender[0] : fullData.Gender) ||
        ''
};

/* ================================
   READ EXPERIMENT DATA
================================ */

const filePathExperiment = './results_data/experimentData/data.txt';
let inputStrExperiment = fs.readFileSync(filePathExperiment, 'utf8').trim();

if (inputStrExperiment.startsWith('-[')) {
    inputStrExperiment = inputStrExperiment.substring(1);
}

let trials = JSON.parse(inputStrExperiment);

if (!Array.isArray(trials)) {
    console.error("❌ Expected array of trials");
    process.exit(1);
}

/* ================================
   CLEAN TRIALS
================================ */

const cleanTrials = trials
    .filter(t => t.task_part === "experimental_trial")
    .map(trial => {
        const { task_part, ...rest } = trial;
        return rest;
    });

/* ================================
   BUILD HEADERS
================================ */

const trialColumns = new Set();
cleanTrials.forEach(row => {
    Object.keys(row).forEach(key => trialColumns.add(key));
});

const columns = [
    "ID",
    "Age",
    "Gender",
    ...Array.from(trialColumns)
];

/* ================================
   BUILD CSV
================================ */

let csvContent = columns.join(',') + '\n';

cleanTrials.forEach((trial, index) => {
    const rowData = {
        ...(index === 0 ? demographicRow : { ID: '', Age: '', Gender: '' }),
        ...trial
    };

    const values = columns.map(col => {
        let value = rowData[col] ?? '';

        if (typeof value === 'string') {
            value = value.replace(/"/g, '""');
            if (value.includes(',') || value.includes('\n')) {
                value = `"${value}"`;
            }
        }

        return value;
    });

    csvContent += values.join(',') + '\n';
});

/* ================================
   SAVE FILE
================================ */

const outputFilePath = './01_f_fwb.csv';
fs.writeFileSync(outputFilePath, csvContent.trim(), 'utf8');

console.log("✅ CSV saved →", outputFilePath);









// old two data 

const fs = require('fs');

/* ================================
   READ DEMOGRAPHIC DATA
================================ */

const filePathDemographic = './results_data/demographicData/data.txt';
let inputStrDemographic = fs.readFileSync(filePathDemographic, 'utf8').trim();

inputStrDemographic = inputStrDemographic
    .replace(/^\s*\{\}\s*/, '')
    .replace(/;\s*$/, '');

const matches = inputStrDemographic.match(/\{[^}]+\}/g);

let fullData = {};
if (matches) {
    for (const block of matches) {
        try {
            const parsed = JSON.parse(block);
            fullData = { ...fullData, ...parsed };
        } catch {}
    }
}

const demographicRow = {
    ID:
        fullData["Participant Nr"] ||
        fullData["Prolific ID"] ||
        fullData["PROLIFIC_PID"] ||
        '',
    Age: fullData["Age"] || '',
    Gender:
        (Array.isArray(fullData.gender) ? fullData.gender[0] : fullData.gender) ||
        (Array.isArray(fullData.Gender) ? fullData.Gender[0] : fullData.Gender) ||
        ''
};

/* ================================
   READ EXPERIMENT DATA
================================ */

const filePathExperiment = './results_data/experimentData/data.txt';
let inputStrExperiment = fs.readFileSync(filePathExperiment, 'utf8').trim();

if (inputStrExperiment.startsWith('-[')) {
    inputStrExperiment = inputStrExperiment.substring(1);
}

const trials = JSON.parse(inputStrExperiment);

/* ================================
   DEFINE COLUMN ORDER (IMPORTANT)
================================ */

const trialColumns = [
    "trial_index_manual",
    "condition",
    "file_left",
    "file_right",
    "gapOf",
    "decision_choice",
    "confidence_rating",
    "rt",
    "trial_type",
    "trial_index",
    "time_elapsed",
    "internal_node_id"
];

const columns = ["ID", "Age", "Gender", ...trialColumns];

/* ================================
   BUILD CSV
================================ */

let csvContent = columns.join(',') + '\n';

trials.forEach((trial, index) => {

    const row = {
        ...(index === 0 ? demographicRow : { ID: '', Age: '', Gender: '' }),
        ...trial
    };

    const values = columns.map(col => {
        let value = row[col] ?? '';

        if (typeof value === 'string') {
            value = value.replace(/"/g, '""');
            if (value.includes(',') || value.includes('\n')) {
                value = `"${value}"`;
            }
        }

        return value;
    });

    csvContent += values.join(',') + '\n';
});

/* ================================
   SAVE FILE
================================ */

const outputFilePath = './01_f_fwb.csv';
fs.writeFileSync(outputFilePath, csvContent.trim(), 'utf8');

console.log("✅ Perfect CSV created:", outputFilePath);








const fs = require('fs');

/* ================================
   READ DEMOGRAPHIC DATA
================================ */

const filePathDemographic = './results_data/demographicData/data.txt';
let inputStrDemographic = fs.readFileSync(filePathDemographic, 'utf8').trim();

inputStrDemographic = inputStrDemographic
    .replace(/^\s*\{\}\s*/, '')
    .replace(/;\s*$/, '');

const matches = inputStrDemographic.match(/\{[^}]+\}/g);

let fullData = {};
if (matches) {
    for (const block of matches) {
        try {
            const parsed = JSON.parse(block);
            fullData = { ...fullData, ...parsed };
        } catch {}
    }
}

const demographicRow = {
    ID:
        fullData["Participant Nr"] ||
        fullData["Prolific ID"] ||
        fullData["PROLIFIC_PID"] ||
        '',
    Age: fullData["Age"] || '',
    Gender:
        (Array.isArray(fullData.gender) ? fullData.gender[0] : fullData.gender) ||
        (Array.isArray(fullData.Gender) ? fullData.Gender[0] : fullData.Gender) ||
        ''
};

/* ================================
   READ EXPERIMENT DATA
================================ */

const filePathExperiment = './results_data/experimentData/data.txt';
let inputStrExperiment = fs.readFileSync(filePathExperiment, 'utf8').trim();

if (inputStrExperiment.startsWith('-[')) {
    inputStrExperiment = inputStrExperiment.substring(1);
}

const trials = JSON.parse(inputStrExperiment);

/* ================================
   DEFINE COLUMN ORDER
================================ */

const trialColumns = [
    "trial_index_manual",
    "condition",
    "file_left",
    "file_right",
    "gapOf",
    "decision_choice",
    "signal_detection",
    "confidence_rating",
    "rt",
    "trial_type",
    "trial_index",
    "time_elapsed",
    "internal_node_id"
];

const columns = ["ID", "Age", "Gender", ...trialColumns];

/* ================================
   SIGNAL DETECTION FUNCTION
================================ */

function getSignalDetection(decision, gap) {
    const g = Number(gap);

    if (decision === 'Different' && g === 0) return 'FA';
    if (decision === 'Different' && g !== 0) return 'Hit';
    if (decision === 'Same' && g === 0) return 'CR';
    if (decision === 'Same' && g !== 0) return 'Miss';

    return '';
}

/* ================================
   BUILD CSV
================================ */

let csvContent = columns.join(',') + '\n';

trials.forEach((trial, index) => {

    const cleanTrial = { ...trial };
    delete cleanTrial.task_part;

    cleanTrial.signal_detection = getSignalDetection(
        cleanTrial.decision_choice,
        cleanTrial.gapOf
    );

    const row = {
        ...(index === 0 ? demographicRow : { ID: '', Age: '', Gender: '' }),
        ...cleanTrial
    };

    const values = columns.map(col => {
        let value = row[col] ?? '';

        if (typeof value === 'string') {
            value = value.replace(/"/g, '""');
            if (value.includes(',') || value.includes('\n')) {
                value = `"${value}"`;
            }
        }

        return value;
    });

    csvContent += values.join(',') + '\n';
});

/* ================================
   SAVE FILE
================================ */

const outputFilePath = './01_f_fwb.csv';
fs.writeFileSync(outputFilePath, csvContent.trim(), 'utf8');

console.log("✅ CSV saved →", outputFilePath);


