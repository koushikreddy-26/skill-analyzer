import os
import requests
from dotenv import load_dotenv

load_dotenv()

def fetch_live_job_skills(role):
    """
    Fetches live job descriptions for the given role via JSearch (RapidAPI).
    Returns a unified string of job descriptions to feed into our Groq LLM.
    """
    api_key = os.getenv("RAPIDAPI_KEY")
    if not api_key or api_key == "your_rapidapi_key_here":
        # Returns None to trigger our local hardcoded fallback
        print("Warning: RAPIDAPI_KEY not found. Falling back to local skills map.")
        return None

    url = "https://jsearch.p.rapidapi.com/search"

    # Search query targeting tech roles specifically
    querystring = {
        "query": f"{role} tech jobs",
        "page": "1",
        "num_pages": "1",
        "date_posted": "week" # Only recent jobs
    }

    headers = {
        "X-RapidAPI-Key": api_key,
        "X-RapidAPI-Host": "jsearch.p.rapidapi.com"
    }

    try:
        response = requests.get(url, headers=headers, params=querystring)
        if response.status_code == 200:
            data = response.json()
            jobs = data.get('data', [])
            
            # Aggregate the job descriptions from the top 5 distinct hits
            descriptions = ""
            for i, job in enumerate(jobs[:5]):
                qualifications = job.get('job_highlights', {}).get('Qualifications', [])
                desc = job.get('job_description', '')
                
                descriptions += f"\n--- Job {i+1} Requirements ---\n"
                # We focus mostly on explicit qualifications 
                if qualifications:
                    descriptions += " ".join(qualifications) + "\n"
                elif desc:
                    # Take the first ~800 chars which usually contains reqs
                    descriptions += desc[:800] + "\n"
                    
            return descriptions.strip()
            
        print("RapidAPI response error:", response.status_code, response.text)
        return None
    except Exception as e:
        print("Failed to fetch live job data from API:", e)
        return None
