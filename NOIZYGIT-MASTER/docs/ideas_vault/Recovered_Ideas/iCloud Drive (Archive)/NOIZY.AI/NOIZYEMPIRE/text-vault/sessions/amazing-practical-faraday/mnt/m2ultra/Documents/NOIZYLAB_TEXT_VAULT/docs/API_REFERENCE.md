# 🔌 GEMINI API - COMPLETE REFERENCE

## 📋 **HOW TO CALL THE API**

### **Method 1: Using Official SDK (Recommended)**

```python
from google import genai
from google.genai import types

# Initialize client
client = genai.Client()

# Call API
response = client.models.generate_content(
    model="gemini-3-pro-preview",  # or "gemini-2.5-flash"
    contents="Your prompt here"
)

# Get response
print(response.text)
```

---

### **Method 2: Using Our Wrapper Classes**

#### **Basic AI:**
```python
from gemini_database.gemini_ai import GeminiAI

gemini = GeminiAI()
response = gemini.generate_text("Your prompt")
print(response)
```

#### **Advanced Features:**
```python
from gemini_database.gemini_advanced import GeminiAdvanced

gemini = GeminiAdvanced()

# Stream response
for chunk in gemini.stream_generate("Your prompt"):
    print(chunk, end="")

# Batch process
results = gemini.batch_process(["Prompt 1", "Prompt 2"])

# Code generation
code = gemini.code_generation("Create API", "python")
```

#### **Code Analysis:**
```python
from gemini_database.gemini_code_analyzer import GeminiCodeAnalyzer

analyzer = GeminiCodeAnalyzer()
result = analyzer.find_race_conditions(code, "C++")
print(result)
```

---

## 🎯 **AVAILABLE API METHODS**

### **1. Basic Text Generation**

```python
from gemini_database.gemini_ai import GeminiAI

gemini = GeminiAI()

# Simple generation
response = gemini.generate_text("Explain quantum computing")

# Solve problem
solution = gemini.solve_problem("My MacBook won't turn on")

# Analyze image
analysis = gemini.analyze_image("photo.jpg", "What is this?")
```

---

### **2. Advanced Features**

```python
from gemini_database.gemini_advanced import GeminiAdvanced

gemini = GeminiAdvanced()

# Streaming (real-time)
for chunk in gemini.stream_generate("Long explanation"):
    print(chunk, end="", flush=True)

# Batch processing (multiple prompts)
results = gemini.batch_process([
    "Fix MacBook",
    "Repair iPhone",
    "Windows issue"
])

# Code generation
code = gemini.code_generation(
    "Create a REST API with authentication",
    "python"
)

# Multi-turn conversation
messages = [
    {"role": "user", "content": "Hello"},
    {"role": "assistant", "content": "Hi there!"},
    {"role": "user", "content": "Help me fix my computer"}
]
response = gemini.multi_turn_conversation(messages)

# Smart search (with web)
result = gemini.smart_search("Latest Python features", use_web=True)
```

---

### **3. Code Analysis**

```python
from gemini_database.gemini_code_analyzer import GeminiCodeAnalyzer

analyzer = GeminiCodeAnalyzer()

# Find race conditions
result = analyzer.find_race_conditions(cpp_code, "C++")

# Find bugs
result = analyzer.find_bugs(python_code)

# Security analysis
result = analyzer.find_security_issues(code)

# Performance analysis
result = analyzer.analyze_performance(code)

# Analyze file
result = analyzer.analyze_file("mycode.py", "bugs")
```

---

### **4. Performance Optimized**

```python
from gemini_database.gemini_performance import GeminiPerformance

perf = GeminiPerformance()

# Optimize for M2 Ultra
perf.optimize_for_m2_ultra()

# Cached generation (instant for repeats)
result = perf.cached_generate("hash", "prompt")

# Batch processing (50x faster)
results = perf.batch_generate([prompt1, prompt2, ...])
```

---

### **5. Automation**

```python
from gemini_database.gemini_automation import GeminiAutomation

auto = GeminiAutomation()

# Auto-diagnose
diagnosis = auto.auto_diagnose(
    {"type": "iPhone", "model": "14 Pro"},
    "Screen cracked"
)

# Auto-generate solution
solution = auto.auto_generate_solution("MacBook won't boot")
```

---

## 🌐 **REST API ENDPOINTS**

### **If Using Web Interface:**

**Base URL:** `http://localhost:5000`

**Endpoints:**
- `POST /solve` - Solve problem
- `POST /generate` - Generate code
- `POST /search` - Smart search
- `POST /stream` - Stream response

**Example:**
```bash
curl -X POST http://localhost:5000/solve \
  -H "Content-Type: application/json" \
  -d '{"problem": "My MacBook won't turn on"}'
```

---

### **If Using Mobile API:**

**Base URL:** `http://localhost:8080/api/v1`

**Endpoints:**
- `POST /solve` - Solve IT problem
- `POST /diagnose` - Auto-diagnose device
- `POST /generate-code` - Generate code
- `GET /health` - Health check

**Example:**
```bash
curl -X POST http://localhost:8080/api/v1/solve \
  -H "Content-Type: application/json" \
  -d '{"problem": "My iPhone won't charge"}'
```

---

## 📝 **COMPLETE EXAMPLES**

### **Example 1: Basic Call**
```python
from google import genai

client = genai.Client()

response = client.models.generate_content(
    model="gemini-3-pro-preview",
    contents="Find the race condition in this C++ code: [code]"
)

print(response.text)
```

### **Example 2: Using Our Wrapper**
```python
from gemini_database.gemini_ai import GeminiAI

gemini = GeminiAI()
result = gemini.solve_problem("My computer is slow")
print(result)
```

### **Example 3: Code Analysis**
```python
from gemini_database.gemini_code_analyzer import GeminiCodeAnalyzer

analyzer = GeminiCodeAnalyzer()

code = """
#include <thread>
int counter = 0;
void increment() { counter++; }
"""

result = analyzer.find_race_conditions(code, "C++")
print(result)
```

### **Example 4: Streaming**
```python
from gemini_database.gemini_advanced import GeminiAdvanced

gemini = GeminiAdvanced()

print("Streaming response:")
for chunk in gemini.stream_generate("Explain AI in detail"):
    print(chunk, end="", flush=True)
```

---

## 🔑 **REQUIRED SETUP**

### **1. Install SDK:**
```bash
pip install -q -U google-genai
```

### **2. Set API Key:**
```bash
export GEMINI_API_KEY='your-api-key-here'
```

### **3. Get API Key:**
- Go to: https://aistudio.google.com/app/api-keys
- Sign in with Google
- Create API key
- Copy your key

---

## 📚 **AVAILABLE MODELS**

- `gemini-3-pro-preview` - Latest, most advanced
- `gemini-2.5-flash` - Fast, efficient
- `gemini-pro` - Standard
- `gemini-pro-vision` - Image understanding

---

## ✅ **QUICK REFERENCE**

**Most Common Calls:**
```python
# Basic
gemini = GeminiAI()
result = gemini.generate_text("prompt")

# Advanced
gemini = GeminiAdvanced()
result = gemini.code_generation("description", "python")

# Code Analysis
analyzer = GeminiCodeAnalyzer()
result = analyzer.find_bugs(code)
```

---

## 🚀 **START USING NOW**

**Quickest way:**
```python
from gemini_database.gemini_ai import GeminiAI

gemini = GeminiAI()
print(gemini.generate_text("Hello, Gemini!"))
```

**Get API key:** https://aistudio.google.com/app/api-keys

