import PyPDF2
import json
import os
import re
import hashlib
from dotenv import load_dotenv
from groq import Groq
from job_market import fetch_live_job_skills

# In-memory cache to freeze identical resume/role combinations
LLM_CACHE = {}

load_dotenv()

# We still retain this as a fallback map or basic list for guiding the LLM
ROLE_SKILLS_MAP = {
    "Data Scientist": ["python", "sql", "machine learning", "pandas", "numpy", "scikit-learn", "statistics", "data visualization", "deep learning", "nlp", "tensorflow", "pytorch"],
    "Frontend Developer": ["html", "css", "javascript", "react", "vue", "angular", "typescript", "tailwind", "redux", "git", "next.js", "vite", "figma", "ui/ux", "dom", "rest", "api"],
    "Backend Developer": ["python", "java", "node.js", "c++", "sql", "mongodb", "postgresql", "docker", "aws", "kubernetes", "django", "flask", "rest API", "microservices", "redis", "linux"],
    "Full Stack Developer": ["javascript", "react", "node.js", "python", "sql", "mongodb", "docker", "git", "aws", "html", "css", "express", "graphql", "tailwind"],
    "DevOps Engineer": ["linux", "docker", "kubernetes", "aws", "azure", "jenkins", "gitlab", "ci/cd", "terraform", "ansible", "python", "bash", "networking"],
    "Data Analyst": ["sql", "excel", "python", "tableau", "power bi", "statistics", "data visualization", "pandas", "data scrubbing"]
}

def extract_text_from_pdf(pdf_file):
    try:
        reader = PyPDF2.PdfReader(pdf_file)
        text = ""
        for page in reader.pages:
            pt = page.extract_text()
            if pt:
                text += pt + "\n"
        return text
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return ""

def process_resume(file, role):
    # 1. Read PDF Context
    text = extract_text_from_pdf(file).strip()
    
    if not text:
        raise Exception("No readable text found in the PDF. Please ensure you upload a text-based PDF, not a scanned image.")
        
    # 2. Check Cache for identical combination
    cache_key = hashlib.md5((text + role).encode('utf-8')).hexdigest()
    if cache_key in LLM_CACHE:
        return LLM_CACHE[cache_key]
    
    # Check if GROQ key exists
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key or api_key == "your_api_key_here":
        raise Exception("Groq API key is missing. Please add it to backend/.env")

    client = Groq(api_key=api_key)
    
    # Fetch Live Job Data
    live_job_context = fetch_live_job_skills(role)
    
    if live_job_context:
        market_instruction = f"LIVE MARKET CONTEXT (Recent Indeed/LinkedIn Postings):\n{live_job_context}\n\nUse this live market data to strictly define the current standard requirements for a {role}. Identify the core repeated technical skills."
    else:
        market_instruction = f"Standard target role skills usually include: {', '.join(ROLE_SKILLS_MAP.get(role, []))}"

    # Create the LLM prompt
    prompt = f"""
    You are a strict, objective ATS parsing engine.
    I am providing you with a candidate's resume and a target role: {role}.
    
    {market_instruction}
    
    Resume Text:
    '''
    {text[:4000]}
    '''

    CRITICAL INSTRUCTION: Analyze ONLY the skills explicitly written in the 'Resume Text'. NEVER assume or hallucinate skills based on the target role. If the Resume Text contains zero technical skills, you MUST return `[]` for matched_skills.

    Compare the explicitly extracted skills against standard industry requirements for a {role}.
    Return ONLY a raw JSON object with the following schema:
    {{
        "matched_skills": ["skill1", "skill2"],
        "missing_skills": ["skill3"],
        "recommendations": [
            {{"skill": "skill3", "type": "Course", "resource": "Specific Course Title"}}
        ]
    }}
    """
    
    chat_completion = client.chat.completions.create(
        messages=[
            {
                "role": "system",
                "content": "You output only structured JSON. Do not use markdown blocks like ```json."
            },
            {
                "role": "user",
                "content": prompt,
            }
        ],
        model="llama-3.1-8b-instant",
        temperature=0.1,
    )
    
    try:
        response_text = chat_completion.choices[0].message.content
        response_text = re.sub(r'```json\n|\n```|```', '', response_text).strip()
        data = json.loads(response_text)
        
        # Clean up case sensitivity and formatting
        matched = set(s.lower().strip() for s in data.get("matched_skills", []))
        missing_raw = set(s.lower().strip() for s in data.get("missing_skills", []))
        
        # Distinct arrays: If a skill somehow appeared in missing but is in matched, remove it
        missing = missing_raw - matched
        
        # Assign cleanly formatted title-cased versions
        data["matched_skills"] = list(sorted([s.title() for s in matched if len(s) < 40]))
        data["missing_skills"] = list(sorted([s.title() for s in missing if len(s) < 40]))
        
        # Force strict mathematical calculation for the match percentage
        total_skills = len(data["matched_skills"]) + len(data["missing_skills"])
        if total_skills > 0:
            data["match_percentage"] = round((len(data["matched_skills"]) / total_skills) * 100)
        else:
            data["match_percentage"] = 0
            
        # Ensure recommendations exist properly
        if "recommendations" not in data:
            data["recommendations"] = []
            
        # Freeze result in cache
        LLM_CACHE[cache_key] = data
        return data
    except Exception as e:
        print("Failed to parse LLM Response:", e, response_text)
        raise Exception("Failed to perform AI analysis. Please try again.")
