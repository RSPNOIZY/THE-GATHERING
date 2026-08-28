import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const SEARCH_QUERY = process.argv[2];
const WORKSPACE_ROOT = process.cwd();

console.clear();
console.log("=====================================================================");
console.log("⚡ [MC96 SYSTEM LOGIC] GLOBAL DEEP SEARCH & GREP MATRIX ENGAGED");
console.log("=====================================================================");

if (!SEARCH_QUERY) {
  const errorMsg = "Omnisearch parameter trace exception. Please provide a spoken search string.";
  console.log(`❌ ERROR: ${errorMsg}`);
  execSync(`say -r 170 "${errorMsg}"`);
  process.exit(1);
}

console.log(`🔍 QUERY VECTOR: "${SEARCH_QUERY}"`);
console.log(`📂 SCANNING FILESYSTEM ROOT: ${WORKSPACE_ROOT}\n`);

function searchFilesRecursive(dir) {
  let matchesFound = 0;
  const list = fs.readdirSync(dir);

  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    
    // Skip heavy operational modules and metadata files
    if (file === 'node_modules' || file === '.git' || file === '.next') return;

    if (fs.statSync(fullPath).isDirectory()) {
      matchesFound += searchFilesRecursive(fullPath);
    } else {
      const fileContent = fs.readFileSync(fullPath, 'utf8');
      if (fileContent.toLowerCase().includes(SEARCH_QUERY.toLowerCase())) {
        matchesFound++;
        console.log(`🎯 MATCH [${matchesFound}] -> ./${path.relative(WORKSPACE_ROOT, fullPath)}`);
        
        // Print out exact line traces matching your query
        const lines = fileContent.split('\n');
        lines.forEach((line, index) => {
          if (line.toLowerCase().includes(SEARCH_QUERY.toLowerCase())) {
            console.log(`   Line ${index + 1}: ${line.trim()}`);
          }
        });
      }
    }
  });
  return matchesFound;
}

const totalMatches = searchFilesRecursive(WORKSPACE_ROOT);

const completionReport = `Omnisearch scan complete. Discovered ${totalMatches} instances matching query vector ${SEARCH_QUERY} inside your agent workspace directories.`;
console.log("\n=====================================================================");
console.log(`🗣️ [Vocal Readout]: "${completionReport}"`);
console.log("=====================================================================");
execSync(`say -r 170 "${completionReport}"`);
