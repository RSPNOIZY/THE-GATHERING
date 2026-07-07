import fs from "node:fs";
import path from "node:path";

const proofDir = path.join(process.cwd(), "artifacts", "proof");
if (!fs.existsSync(proofDir)) throw new Error("BLOCKED: artifacts/proof missing");

const proofFile = fs.readdirSync(proofDir).find(f => f.endsWith(".json"));
if (!proofFile) throw new Error("BLOCKED: no proof bundle found");

const proof = JSON.parse(fs.readFileSync(path.join(proofDir, proofFile), "utf8"));
const contractPath = path.join(process.cwd(), "contracts", "routes", "consent-gateway.routes.json");
if (!fs.existsSync(contractPath)) throw new Error("BLOCKED: missing routes contract");

const contract = JSON.parse(fs.readFileSync(contractPath, "utf8"));

const sameSet = (a, b) =>
  Array.isArray(a) && Array.isArray(b) &&
  a.length === b.length &&
  a.every(x => b.includes(x));

if (proof.routing_contract !== contract.routing_contract) throw new Error("FAIL: routing_contract mismatch");
if (!sameSet(proof.routes_public, contract.routes_public)) throw new Error("FAIL: routes_public mismatch");
if (!sameSet(proof.routes_protected, contract.routes_protected)) throw new Error("FAIL: routes_protected mismatch");

console.log("PASS: proof matches canonical contract");
