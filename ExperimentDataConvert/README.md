# Demographic & Experimental Data Parser

This project reads and combines **demographic** and **experimental** data from text files, parses the information, and generates a structured **CSV** file named `01_f_fwb.csv`.

---

## 📁 Project Structure

```
project-root/
│
├── results_data/
│   ├── demographicData/
│   │   └── data.txt         # Contains JSON-like demographic data
│   └── experimentData/
│       └── data.txt         # Contains experimental data blocks
│   ├── 01_f_fwb.csv             # Output CSV file
│   ├── script.js                # Your Node.js script (provided above)
```

---

## ⚙️ Prerequisites

Before running the script, make sure you have the following installed:

### ✅ 1. Install [Node.js](https://nodejs.org/)

- Go to [https://nodejs.org](https://nodejs.org)
- Download the **LTS** version for your operating system.
- Follow the installation steps.

📦 To verify installation, run in your terminal:

```bash
node -v
npm -v
```

You should see version numbers for both.

---

### ✅ 2. Install [Visual Studio Code](https://code.visualstudio.com/)

- Visit [https://code.visualstudio.com/](https://code.visualstudio.com/)
- Download and install VS Code for your OS.

> VS Code is optional but recommended for editing and running your Node.js code.

---

## 🚀 Running the Script

### Step 1: Clone or set up your project directory

Ensure the following structure exists:

```
DataConversion/
├── demographicData/data.txt
└── experimentData/data.txt
```

Make sure both `data.txt` files are correctly formatted.

---

### Step 2: Save the Script

Create a file named `script.js` and paste the code you provided.

---

### Step 3: Run the Script

Open a terminal or VS Code terminal in the project root and run:

```bash
node script.js
```

If everything is correct, you'll see:

```
File saved successfully as ./01_f_fwb.csv //you may change the file name as your desired name
```

---

## 🛠 Notes

- Make sure your demographic `data.txt` contains valid JSON after cleaning (e.g., no trailing `;` or extra `{}`).
- Your experimental data blocks must be separated by `$` and use `:` to separate keys and values (e.g., `Trial:1; Time:12:03:44`).

---

## 📄 Output

The script will generate:

```
01_f_fwb.csv
```

This file contains combined demographic and experiment data in CSV format, with headers and values aligned.

---

## 🧑‍💻 Author

Built by [Hasib][hasib.29690@gmail.com]

---