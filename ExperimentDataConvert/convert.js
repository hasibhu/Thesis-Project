



const fs = require('fs');

/* ================================
   HELPER: NORMALIZE SIGNAL DETECTION
================================ */

function normalizeSignalDetection(value) {
    if (!value) return '';

    const v = String(value).toLowerCase().trim();

    if (v === 'hit') return 'Hit';
    if (v === 'correct_rejection') return 'CR';
    if (v === 'false_alarm') return 'FA';
    if (v === 'miss') return 'Miss';

    return value;
}

/* ================================
   READ DEMOGRAPHIC DATA
================================ */

const filePathDemographic = './results_data/demographicData/data.txt';
let inputStrDemographic = fs.readFileSync(filePathDemographic, 'utf8').trim();

inputStrDemographic = inputStrDemographic
    .replace(/^\s*\{\}\s*/, '')
    .replace(/;\s*$/, '');

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
    } catch {
        console.warn("⚠️ Skipping invalid demographic block");
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
   CLEAN TRIALS
================================ */

const cleanTrials = trials
    .filter(t => t.task_part === "experimental_trial")
    .map(trial => {
        const { task_part, ...rest } = trial;
        return {
            ...rest,
            signal_detection: normalizeSignalDetection(rest.signal_detection)
        };
    });

if (cleanTrials.length === 0) {
    console.error("❌ No experimental trials found");
    process.exit(1);
}

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