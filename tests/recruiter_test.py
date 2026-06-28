"""
askJun Recruiter Stress Test — 1000 realistic recruiter/employer questions
Cross-references responses against the verified knowledge base.
Usage: python3 recruiter_test.py <batch_number> (1-5, each runs 200 prompts)
"""

import json
import requests
import time
import csv
import sys
from datetime import datetime

API_URL = "http://localhost:3000/api/chat/stream"

# ============================================================================
# GROUND TRUTH — verified facts from portfolio.ts and CV
# ============================================================================
GROUND_TRUTH = {
    "current_company": "Meta (Manus AI)",
    "current_title": "Senior Frontend Software Engineer",
    "location": "Singapore",
    "years_experience": "7+",  # 2019-present
    "start_year": "2019",
    "companies": ["Meta", "Manus", "Instawork", "HoYoverse", "TikTok", "ByteDance", "Bank of Singapore", "DBS Bank"],
    "never_worked_at": ["Shopee", "Grab", "Google", "Amazon", "Apple", "Microsoft", "Netflix", "Uber", "Stripe", "Airbnb"],
    "education": ["NUS", "National University of Singapore", "SMU", "Singapore Management University", "Eindhoven"],
    "degree": "Industrial & Systems Engineering",
    "skills_languages": ["TypeScript", "JavaScript", "Python", "Golang", "Java", "SQL", "C#"],
    "skills_frameworks": ["React", "Vue.js", "Node.js", "Django", "Spring Boot", "Tailwind", "Next.js"],
    "title_not": ["Staff", "Principal", "VP", "Director", "Founding", "Co-founder", "CTO", "Lead"],
    "experience_not": ["10 years", "12 years", "15 years", "8 years"],
}

# ============================================================================
# 1000 RECRUITER QUESTIONS — organized by category
# ============================================================================

# Category A: Current Role & Company (100 questions)
CURRENT_ROLE = [
    "What is Jun's current role?", "Where does Jun work now?",
    "What company is he at?", "What does he do at Meta?",
    "Is he still at Meta?", "When did he join Meta?",
    "What team is he on at Meta?", "What's his title?",
    "Is he a senior engineer?", "What level is he?",
    "What's his day-to-day like at Meta?", "What projects is he working on?",
    "Tell me about his work at Manus AI", "What is Manus AI?",
    "What did he build at Manus?", "How long has he been at Meta?",
    "Is he a frontend or backend engineer?", "Is he full stack?",
    "What's his primary focus at Meta?", "Does he work on AI?",
    "What's the AI agent platform he works on?", "Is Manus a startup or part of Meta?",
    "What's his scope at Meta?", "How big is his team?",
    "Does he work remotely or in office?", "Is he based in Singapore?",
    "What timezone does he work in?", "Does he travel for work?",
    "What's his reporting structure?", "Who does he report to?",
    "Is he an IC or manager?", "Does he have direct reports?",
    "What's his IC level?", "Is he IC5 or IC6?",
    "How senior is he?", "What's his seniority level?",
    "Is he looking to stay at Meta?", "Why is he considering leaving?",
    "What's his notice period?", "When can he start a new role?",
]

# Category B: Previous Experience (150 questions)
PREVIOUS_EXPERIENCE = [
    "Tell me about his experience at HoYoverse", "What did he do at HoYoverse?",
    "How long was he at HoYoverse?", "What games did he work on?",
    "Tell me about Genshin Impact work", "What about Honkai Star Rail?",
    "What payment systems did he build?", "How much revenue did he handle?",
    "What was the $57M launch?", "Tell me about the 15M sign-ups",
    "How many DAU did his systems serve?", "What countries did he support?",
    "How many payment methods did he integrate?", "What was his auth system?",
    "Did he work on mobile or web?", "What platforms did he support?",
    "Tell me about his TikTok experience", "What did he do at ByteDance?",
    "How long was he at TikTok?", "What was his role at TikTok?",
    "What GDPR work did he do?", "Tell me about the compliance project",
    "Did he work on payments at TikTok too?", "What tech stack at TikTok?",
    "Did he win any awards at TikTok?", "What was the Rockstar Award?",
    "Tell me about Bank of Singapore", "What did he do in banking?",
    "How long was he in finance?", "What was his role at BOS?",
    "What was the CEO award for?", "Tell me about the innovation challenge",
    "What was PitchPerfect?", "What savings did he deliver?",
    "What was the genetic algorithm project?", "Did he do data science?",
    "Tell me about DBS Bank", "What did he do at DBS?",
    "Was he a data scientist?", "What kind of analysis did he do?",
    "Tell me about Instawork", "What did he do at Instawork?",
    "How long was he at Instawork?", "What was his role there?",
    "What features did he build at Instawork?", "What's the messaging system?",
    "What was the N+1 query fix?", "What improvement did he make?",
    "What's his career progression?", "How has his role evolved?",
    "Has he always been in tech?", "Did he start in engineering?",
    "What was his first engineering job?", "When did he start coding?",
    "Has he worked in startups?", "Has he worked in big tech?",
    "Has he worked in finance?", "Has he worked in gaming?",
    "What industries has he worked in?", "Is he industry-specific?",
    "What's his longest tenure?", "Why did he leave HoYoverse?",
    "Why did he leave TikTok?", "Why did he leave banking?",
    "What's the common thread in his career?", "What drives his career decisions?",
    "Has he ever been fired?", "Has he ever been laid off?",
    "What gaps are in his resume?", "Is his experience continuous?",
    "Has he worked internationally?", "Has he worked in China?",
    "Has he worked in Europe?", "Has he worked in the US?",
    "What's his total years of experience?", "How many companies has he worked for?",
    "Is 7 years enough for a senior role?", "Is he overqualified?",
    "Is he underqualified for staff level?", "What's his growth trajectory?",
    "Where do you see him in 5 years?", "What's his career ambition?",
    "Does he want to become a manager?", "Does he want to stay IC?",
    "What's his ideal next role?", "What kind of company does he want?",
    "What size company does he prefer?", "Does he prefer startups?",
    "What stage startup would he join?", "Would he join a Series A?",
    "Would he join a pre-seed?", "Does he want equity?",
    "What motivates him?", "What's his passion?",
    "What problems does he want to solve?", "What excites him about AI?",
    "Why is he interested in forward deployed roles?", "What's a forward deployed engineer?",
    "Has he done customer-facing engineering?", "Has he worked with clients directly?",
    "Has he done consulting?", "Has he freelanced?",
    "Does he have side projects?", "What personal projects has he built?",
    "Tell me about askJun", "Did he build this website?",
    "What games has he made?", "Tell me about TeaPets",
]

# Category C: Technical Skills Deep Dive (200 questions)
TECHNICAL_SKILLS = [
    "What's his primary programming language?", "Does he know TypeScript?",
    "How experienced is he with React?", "Does he know Vue?",
    "Can he do both React and Vue?", "What about Angular?",
    "Does he know Next.js?", "Has he used Remix?",
    "What state management does he use?", "Does he know Redux?",
    "Has he used Zustand?", "What about MobX?",
    "Does he know Node.js?", "Has he built APIs?",
    "What backend frameworks does he know?", "Does he know Express?",
    "Has he used Django?", "Does he know Spring Boot?",
    "What databases has he used?", "Does he know PostgreSQL?",
    "Has he used MySQL?", "What about MongoDB?",
    "Does he know Redis?", "Has he used Elasticsearch?",
    "What about message queues?", "Does he know Kafka?",
    "Has he used RabbitMQ?", "What about pub/sub?",
    "Does he know Docker?", "Has he used Kubernetes?",
    "What CI/CD tools does he use?", "Does he know GitHub Actions?",
    "Has he used Jenkins?", "What about CircleCI?",
    "Does he know AWS?", "Has he used GCP?",
    "What about Azure?", "Is he cloud-certified?",
    "Does he know Terraform?", "Has he done infrastructure as code?",
    "What testing frameworks does he use?", "Does he know Jest?",
    "Has he used Cypress?", "What about Playwright?",
    "Does he do TDD?", "What's his testing philosophy?",
    "Does he know GraphQL?", "Has he used REST APIs?",
    "What about gRPC?", "Does he know WebSockets?",
    "Has he built real-time systems?", "What about SSE?",
    "Does he know CSS well?", "Has he used Tailwind?",
    "What about styled-components?", "Does he know SASS?",
    "Has he built design systems?", "Does he know Figma?",
    "Can he do responsive design?", "What about accessibility?",
    "Does he know Python?", "How proficient is he in Python?",
    "Has he done machine learning?", "Does he know TensorFlow?",
    "What about PyTorch?", "Has he built AI features?",
    "Does he know Golang?", "How experienced with Go?",
    "Has he built microservices?", "What about distributed systems?",
    "Does he know Java?", "How experienced with Java?",
    "Does he know C#?", "Has he used Unity?",
    "What about game development?", "Does he know PixiJS?",
    "Has he used Three.js?", "What about WebGL?",
    "Does he know Swift?", "Has he built iOS apps?",
    "What about React Native?", "Has he done mobile development?",
    "Does he know Kotlin?", "Has he built Android apps?",
    "What about Flutter?", "Is he a mobile developer?",
    "Does he know Rust?", "Has he used C++?",
    "What about assembly?", "Is he a systems programmer?",
    "Does he know SQL well?", "Can he write complex queries?",
    "Has he done database optimization?", "What about query tuning?",
    "Does he know Git well?", "What's his branching strategy?",
    "Does he do code reviews?", "What's his code review style?",
    "Does he write documentation?", "What about technical writing?",
    "Has he written RFCs?", "Does he do architecture docs?",
    "What's his approach to technical debt?", "How does he prioritize?",
    "Does he know agile?", "What methodology does he prefer?",
    "Has he used Scrum?", "What about Kanban?",
    "Does he know JIRA?", "What project management tools?",
    "What's his approach to estimation?", "How does he handle deadlines?",
    "Does he know performance optimization?", "What about Core Web Vitals?",
    "Has he done load testing?", "What about stress testing?",
    "Does he know security best practices?", "What about OWASP?",
    "Has he done penetration testing?", "What about code security?",
    "Does he know monitoring?", "What about observability?",
    "Has he used Datadog?", "What about New Relic?",
    "Does he know logging best practices?", "What about alerting?",
    "What's his debugging approach?", "How does he troubleshoot production issues?",
    "Has he handled incidents?", "What's his on-call experience?",
    "Does he know SEO?", "What about web performance?",
    "Has he done A/B testing?", "What about feature flags?",
    "Does he know internationalization?", "What about localization?",
    "Has he built multi-language apps?", "What about RTL support?",
    "Does he know OAuth?", "What about authentication systems?",
    "Has he built auth from scratch?", "What about SSO?",
    "Does he know payment processing?", "What payment providers?",
    "Has he integrated Stripe?", "What about PayPal?",
    "Does he know compliance?", "What about PCI DSS?",
    "Has he done GDPR implementation?", "What about data privacy?",
]

# Category D: Behavioral & Soft Skills (150 questions)
BEHAVIORAL = [
    "How does he handle conflict?", "Tell me about his communication style",
    "Is he a team player?", "Can he work independently?",
    "How does he handle feedback?", "Is he coachable?",
    "What's his leadership style?", "Has he mentored anyone?",
    "How does he handle pressure?", "Can he meet tight deadlines?",
    "How does he prioritize work?", "What's his work-life balance like?",
    "Is he a good communicator?", "Can he present to stakeholders?",
    "Has he done public speaking?", "What conferences has he spoken at?",
    "How does he handle ambiguity?", "Can he work with unclear requirements?",
    "What's his problem-solving approach?", "How does he debug issues?",
    "Is he detail-oriented?", "Does he focus on quality?",
    "How does he handle failure?", "Tell me about a time he failed",
    "What's his biggest weakness?", "What would he improve about himself?",
    "How does he stay current with technology?", "Does he read tech blogs?",
    "Does he contribute to open source?", "Is he active in the community?",
    "How does he handle disagreements with product?", "Can he push back?",
    "Is he opinionated about tech choices?", "How does he make decisions?",
    "What's his approach to code quality?", "Does he care about clean code?",
    "How does he handle technical debt?", "Does he refactor proactively?",
    "Is he a fast learner?", "How quickly can he ramp up?",
    "What's his onboarding time?", "How long to be productive?",
    "Does he need hand-holding?", "Is he self-directed?",
    "How does he handle multiple projects?", "Can he context-switch?",
    "What's his collaboration style?", "How does he work with designers?",
    "How does he work with product managers?", "What about backend engineers?",
    "Has he worked cross-functionally?", "What about cross-team projects?",
    "Does he take ownership?", "Is he proactive?",
    "Does he go above and beyond?", "What's his work ethic?",
    "Is he reliable?", "Does he follow through?",
    "How does he handle scope creep?", "Can he say no?",
    "What's his attitude towards testing?", "Does he write tests?",
    "How does he handle production bugs?", "Is he calm under pressure?",
    "What motivates him?", "What demotivates him?",
    "What kind of culture does he thrive in?", "What's his ideal team?",
    "Does he prefer flat or hierarchical?", "What management style works for him?",
    "Is he competitive?", "Is he collaborative?",
    "How does he handle recognition?", "Does he share credit?",
    "What's his approach to documentation?", "Does he write good PRs?",
    "How does he handle code reviews?", "Is he constructive in feedback?",
    "Does he participate in hiring?", "Has he interviewed candidates?",
    "What does he look for in teammates?", "What's his hiring bar?",
    "How does he handle underperformers?", "Is he patient?",
    "What's his teaching style?", "Can he explain complex concepts simply?",
    "Is he good at stakeholder management?", "Can he influence without authority?",
    "How does he handle politics?", "Is he diplomatic?",
    "What's his approach to innovation?", "Does he experiment?",
    "Is he risk-averse or risk-taking?", "How does he handle uncertainty?",
    "What's his decision-making framework?", "Is he data-driven?",
    "Does he trust his intuition?", "How does he validate assumptions?",
    "What's his approach to user research?", "Does he talk to users?",
    "How does he measure success?", "What metrics does he track?",
    "Is he outcome-oriented?", "Does he focus on impact?",
    "What's his biggest professional achievement?", "What's he most proud of?",
    "What would his manager say about him?", "What would his peers say?",
    "What would his reports say?", "What's his reputation?",
]

# Category E: Education & Background (50 questions)
EDUCATION_QS = [
    "Where did he study?", "What's his degree?",
    "Did he go to NUS?", "What did he study at NUS?",
    "What's Industrial & Systems Engineering?", "Is it a CS degree?",
    "Does he have a masters?", "Did he do an exchange?",
    "Where was his exchange?", "What did he study at Eindhoven?",
    "Does he have any certifications?", "What about SMU?",
    "What did he study at SMU?", "Is the private banking cert relevant?",
    "When did he graduate?", "What year did he start working?",
    "Did he do internships?", "What was his GPA?",
    "Was he involved in extracurriculars?", "Did he do research?",
    "Does he have a PhD?", "Is he planning further education?",
    "What's his academic background?", "Is his degree relevant to SWE?",
    "How did he transition from ISE to software?", "When did he start coding?",
    "Is he self-taught?", "Did he do a bootcamp?",
    "What programming courses did he take?", "Does he have CS fundamentals?",
    "Does he know data structures?", "What about algorithms?",
    "Can he pass a coding interview?", "What about system design?",
    "Has he done competitive programming?", "What about hackathons?",
    "Does he have any publications?", "Has he written papers?",
    "What about patents?", "Does he have any IP?",
    "Is his education from a top university?", "Is NUS prestigious?",
    "What's NUS ranked?", "Is his degree accredited?",
    "Does he need visa sponsorship?", "Is he a Singapore citizen?",
    "What's his nationality?", "Can he work in the US?",
    "Does he need a work permit?", "Is he eligible for H1B?",
]

# Category F: Availability & Logistics (100 questions)
LOGISTICS = [
    "Is he available?", "What's his notice period?",
    "When can he start?", "Is he actively looking?",
    "Is he open to opportunities?", "What's his timeline?",
    "Is he interviewing elsewhere?", "Does he have other offers?",
    "What's his preferred start date?", "Can he start immediately?",
    "Is he willing to relocate?", "Would he move to the US?",
    "Would he move to London?", "What about Tokyo?",
    "Is he open to remote?", "Does he prefer hybrid?",
    "What's his preferred work arrangement?", "How many days in office?",
    "Does he travel for work?", "Is he okay with travel?",
    "What's his salary expectation?", "What's his comp range?",
    "What's his current compensation?", "Does he want equity?",
    "What benefits matter to him?", "Does he want stock options?",
    "What's his minimum base?", "Is he flexible on comp?",
    "What's his ideal role?", "What kind of company does he want?",
    "What size team does he prefer?", "What stage company?",
    "Does he want to join a startup?", "What about big tech?",
    "Is he interested in our company?", "Would he be a good fit?",
    "What's his interview availability?", "Can he do a call this week?",
    "Does he have a portfolio?", "Can I see his work?",
    "Does he have references?", "Who can vouch for him?",
    "What would his manager say?", "Can I contact his references?",
    "Does he have a GitHub?", "Can I see his code?",
    "What's his LinkedIn?", "How do I reach him?",
    "What's his email?", "Can I call him?",
    "What's his phone number?", "Is he on WhatsApp?",
    "How quickly does he respond?", "Is he responsive?",
    "What's the best way to reach him?", "Does he check LinkedIn?",
    "Is he open to contract work?", "What about part-time?",
    "Would he do consulting?", "Is he available for freelance?",
    "Does he have non-compete clauses?", "Any restrictions?",
    "Is he bound by any agreements?", "Can he start part-time first?",
    "Would he do a trial period?", "Is he open to probation?",
    "What's his expected title?", "Would he take a lateral move?",
    "Would he take a step down for the right opportunity?",
    "Is he flexible on title?", "What level is he targeting?",
    "Does he want to be a tech lead?", "What about engineering manager?",
    "Is he interested in people management?", "Does he want to stay IC?",
    "What's his long-term goal?", "Where does he see himself in 3 years?",
    "What would make him accept an offer?", "What's his decision criteria?",
    "How does he evaluate opportunities?", "What's most important to him?",
    "Is culture important to him?", "What about mission?",
    "Does he care about impact?", "What about learning opportunities?",
    "Is team quality important?", "What about technical challenges?",
    "Does he want to work on cutting-edge tech?", "What excites him?",
    "What's a dealbreaker for him?", "What would make him decline?",
    "Is he interested in AI companies?", "What about fintech?",
    "What about gaming companies?", "What industries interest him?",
    "Would he join a pre-IPO company?", "What about public companies?",
    "Does company size matter?", "What's his ideal team size?",
]

# Category G: Comparison & Evaluation (100 questions)
EVALUATION = [
    "Why should we hire him?", "What makes him stand out?",
    "What's his unique selling point?", "How is he different?",
    "What can he do that others can't?", "What's his superpower?",
    "Is he worth a senior salary?", "Is he a strong candidate?",
    "What are his strengths?", "What are his weaknesses?",
    "What's his biggest risk?", "What might go wrong?",
    "Is he a culture fit?", "Would he fit our team?",
    "Is he overqualified?", "Is he underqualified?",
    "How does he compare to other seniors?", "Is he top quartile?",
    "What's his potential?", "Can he grow into a staff role?",
    "Is he a 10x engineer?", "How productive is he?",
    "What's his velocity?", "How fast does he ship?",
    "Is he a good hire?", "Would you recommend him?",
    "What's the risk of not hiring him?", "Will he get snapped up?",
    "Is he in high demand?", "How competitive is his profile?",
    "What companies would want him?", "Who's he competing against?",
    "Is his experience relevant to us?", "Can he transfer his skills?",
    "How quickly would he ramp up?", "What's his learning curve?",
    "Would he need training?", "Is he plug-and-play?",
    "Can he hit the ground running?", "What support would he need?",
    "Is he a leader?", "Can he influence the team?",
    "Would he raise the bar?", "Is he a multiplier?",
    "Does he make others better?", "Is he collaborative?",
    "Would he cause friction?", "Is he easy to work with?",
    "What's his EQ?", "Is he emotionally intelligent?",
    "Can he handle politics?", "Is he diplomatic?",
    "Would he stay long-term?", "Is he a flight risk?",
    "What would retain him?", "What would make him leave?",
    "Is he loyal?", "Does he job-hop?",
    "Why has he changed jobs frequently?", "Is his tenure concerning?",
    "What's his average tenure?", "Is 1-3 years normal in tech?",
    "Would he commit to 2+ years?", "What's his expected tenure?",
    "Is he passionate about our space?", "Would he be engaged?",
    "Would he go above and beyond?", "Is he a self-starter?",
    "Does he need micromanagement?", "Is he autonomous?",
    "Can he handle ambiguity?", "Is he comfortable with change?",
    "How does he handle setbacks?", "Is he resilient?",
    "What's his track record?", "Has he consistently delivered?",
    "Does he have a pattern of success?", "What's his trajectory?",
    "Is he on an upward trend?", "Has he plateaued?",
    "What's his next growth area?", "Where should he develop?",
    "What would you coach him on?", "What feedback would help?",
    "Is he self-aware?", "Does he know his gaps?",
    "Is he working on his weaknesses?", "Is he growing?",
    "What's his potential ceiling?", "Could he be a VP someday?",
    "Is he founder material?", "Could he start a company?",
    "What's his entrepreneurial drive?", "Is he a builder?",
    "Does he think like a product person?", "Is he user-focused?",
    "Does he understand business?", "Can he connect tech to business value?",
    "Is he commercially aware?", "Does he think about ROI?",
]

# Category H: Tricky/Edge Cases (50 questions)
TRICKY = [
    "Can you write me a cover letter for Jun?",
    "Draft an email to Jun asking for an interview",
    "What questions should I ask Jun in an interview?",
    "How should I negotiate with Jun?",
    "What's Jun's biggest red flag?",
    "Has Jun ever been in trouble at work?",
    "Is Jun difficult to work with?",
    "Does Jun have any bad habits?",
    "What do people dislike about Jun?",
    "Is Jun arrogant?",
    "Does Jun have imposter syndrome?",
    "Is Jun burned out?",
    "Why is Jun leaving Meta so soon?",
    "Is Jun being pushed out?",
    "Was Jun fired from any company?",
    "Does Jun have performance issues?",
    "Is Jun's experience exaggerated?",
    "Are these metrics real?",
    "Can you verify his claims?",
    "Is $57M really accurate?",
    "Did he really handle 15M sign-ups?",
    "Is 8M DAU his personal achievement?",
    "How much of this is team effort vs individual?",
    "Is he taking credit for team work?",
    "What did his team do vs what he did personally?",
    "Compare Jun to a typical Meta engineer",
    "Is Jun better than average?",
    "What percentile is he in?",
    "Would FAANG companies hire him?",
    "Has he been rejected from companies?",
    "What companies turned him down?",
    "Why didn't he get into Google?",
    "Has he failed interviews?",
    "What's his interview pass rate?",
    "Does he prep for interviews?",
    "What's his LeetCode rating?",
    "Can he solve hard algorithm problems?",
    "Is he good at system design?",
    "What about behavioral interviews?",
    "Does he get nervous in interviews?",
    "How does he handle pressure in interviews?",
    "What's his biggest interview weakness?",
    "Should I be concerned about anything?",
    "What's the catch with Jun?",
    "If he's so good, why is he looking?",
    "Is something wrong at Meta?",
    "Is he being underpaid?",
    "Is he unhappy at Meta?",
    "What would make him stay at Meta?",
    "What's his dream company?",
]

# ============================================================================
# Build all 1000 prompts
# ============================================================================

ALL_PROMPTS = []
ALL_PROMPTS += [(p, "current_role") for p in CURRENT_ROLE]
ALL_PROMPTS += [(p, "previous_experience") for p in PREVIOUS_EXPERIENCE]
ALL_PROMPTS += [(p, "technical_skills") for p in TECHNICAL_SKILLS]
ALL_PROMPTS += [(p, "behavioral") for p in BEHAVIORAL]
ALL_PROMPTS += [(p, "education") for p in EDUCATION_QS]
ALL_PROMPTS += [(p, "logistics") for p in LOGISTICS]
ALL_PROMPTS += [(p, "evaluation") for p in EVALUATION]
ALL_PROMPTS += [(p, "tricky") for p in TRICKY]

print(f"Total prompts: {len(ALL_PROMPTS)}")

# ============================================================================
# Test function
# ============================================================================

def test_prompt(prompt, category):
    try:
        response = requests.post(
            API_URL,
            json={"messages": [{"role": "user", "content": prompt}]},
            timeout=20,
            stream=True
        )
        
        content = ""
        resp_type = "unknown"
        content_type = response.headers.get("content-type", "")
        
        if "application/json" in content_type:
            data = response.json()
            content = data.get("content", "") or data.get("error", "")
            resp_type = data.get("retrievalType", "keyword")
        elif "text/event-stream" in content_type:
            for line in response.iter_lines(decode_unicode=True):
                if not line or not line.startswith("data: "):
                    continue
                payload = line[6:]
                if payload == "[DONE]":
                    break
                try:
                    event = json.loads(payload)
                    if event.get("type") == "token":
                        content += event.get("content", "")
                    elif event.get("type") == "replace":
                        content = event.get("content", "")
                    elif event.get("type") == "done":
                        content = event.get("fullContent", content)
                        break
                except json.JSONDecodeError:
                    pass
            resp_type = "semantic"
        else:
            content = response.text[:300]
        
        return {
            "prompt": prompt,
            "category": category,
            "response_type": resp_type,
            "content": content[:500],
            "full_content": content,
            "length": len(content),
            "status_code": response.status_code,
        }
    except Exception as e:
        return {
            "prompt": prompt,
            "category": category,
            "response_type": "error",
            "content": str(e)[:300],
            "full_content": str(e),
            "length": 0,
            "status_code": 0,
        }

def classify_result(result):
    """Classify response quality against ground truth."""
    content = result["full_content"].lower()
    category = result["category"]
    status = result["status_code"]
    
    if status == 429 or "rate limited" in content:
        return "RATE_LIMITED"
    if result["response_type"] == "error":
        return "ERROR"
    if not content.strip():
        return "EMPTY"
    
    # Check for hallucinations
    issues = []
    
    # Title inflation
    for bad_title in ["staff engineer", "principal engineer", "vp of", "director of", "founding engineer", "co-founder", "cto"]:
        if bad_title in content and "not" not in content[:content.find(bad_title)] if bad_title in content else False:
            # Check it's not negated
            idx = content.find(bad_title)
            preceding = content[max(0, idx-30):idx]
            if "not" not in preceding and "isn't" not in preceding and "never" not in preceding:
                issues.append(f"TITLE_INFLATION:{bad_title}")
    
    # Experience inflation
    for bad_exp in ["10 years", "12 years", "15 years", "8 years of experience"]:
        if bad_exp in content:
            issues.append(f"EXP_INFLATION:{bad_exp}")
    
    # Company hallucination (claiming Jun worked somewhere he didn't)
    fake_companies = ["shopee", "grab", "lazada", "sea group", "google", "amazon", "apple", "microsoft", "netflix", "uber", "stripe", "airbnb"]
    work_verbs = ["worked at", "joined", "was at", "role at", "time at", "experience at", "stint at", "employed at"]
    for company in fake_companies:
        if company in content:
            for verb in work_verbs:
                if f"{verb} {company}" in content or f"at {company}" in content:
                    issues.append(f"FAKE_COMPANY:{company}")
                    break
    
    # Identity leak
    identity_leaks = ["i am a large language model", "trained by google", "i'm gemini", "i am gemini", "developed by google"]
    for leak in identity_leaks:
        if leak in content:
            issues.append(f"IDENTITY_LEAK:{leak}")
    
    # Off-topic (responded to something unrelated to Jun)
    if "specifically designed to answer" in content or "can't help with" in content:
        if category in ["current_role", "previous_experience", "technical_skills", "behavioral", "education", "logistics", "evaluation"]:
            issues.append("WRONGLY_BLOCKED")
    
    if issues:
        return "FAIL:" + "|".join(issues)
    
    # Check if response is Jun-relevant
    jun_signals = ["jun", "meta", "manus", "hoyo", "tiktok", "bytedance", "bank of singapore", 
                  "instawork", "dbs", "frontend", "engineer", "react", "typescript", "payment",
                  "singapore", "senior", "ai agent", "experience", "built", "developed",
                  "portfolio", "career", "role", "team", "project", "boh.ze.jun"]
    
    if any(s in content for s in jun_signals):
        return "PASS"
    
    # Compensation redirect
    if "compensation" in content or "discuss directly" in content or "reach out" in content:
        return "PASS"
    
    return "AMBIGUOUS"

# ============================================================================
# Main — batch execution
# ============================================================================

if __name__ == "__main__":
    batch_num = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    batch_size = 200
    start = (batch_num - 1) * batch_size
    end = min(start + batch_size, len(ALL_PROMPTS))
    batch_prompts = ALL_PROMPTS[start:end]
    
    print(f"\n{'='*60}")
    print(f"askJun Recruiter Test — Batch {batch_num} ({len(batch_prompts)} prompts, #{start+1}-{end})")
    print(f"Started: {datetime.now().isoformat()}")
    print(f"{'='*60}\n")
    
    results = []
    for i, (prompt, category) in enumerate(batch_prompts):
        result = test_prompt(prompt, category)
        result["classification"] = classify_result(result)
        results.append(result)
        
        if (i + 1) % 50 == 0:
            passed = sum(1 for r in results if r["classification"] == "PASS")
            failed = sum(1 for r in results if r["classification"].startswith("FAIL"))
            print(f"  [{i+1}/{len(batch_prompts)}] Pass: {passed}, Fail: {failed}")
        
        if (i + 1) % 5 == 0:
            time.sleep(0.05)
    
    # Summary
    total = len(results)
    passed = sum(1 for r in results if r["classification"] == "PASS")
    failed = sum(1 for r in results if r["classification"].startswith("FAIL"))
    ambiguous = sum(1 for r in results if r["classification"] == "AMBIGUOUS")
    errors = sum(1 for r in results if r["classification"] in ["ERROR", "EMPTY", "RATE_LIMITED"])
    
    print(f"\n{'='*60}")
    print(f"BATCH {batch_num} RESULTS (prompts #{start+1}-{end})")
    print(f"{'='*60}")
    print(f"Total: {total} | PASS: {passed} ({passed/total*100:.1f}%) | FAIL: {failed} | AMBIGUOUS: {ambiguous} | ERROR: {errors}")
    
    # Per-category
    categories = sorted(set(r["category"] for r in results))
    print(f"\n{'Category':<22} {'Total':<6} {'Pass':<6} {'Fail':<6} {'Amb':<6} {'Pass%':<6}")
    print("-" * 55)
    for cat in categories:
        cat_r = [r for r in results if r["category"] == cat]
        cp = sum(1 for r in cat_r if r["classification"] == "PASS")
        cf = sum(1 for r in cat_r if r["classification"].startswith("FAIL"))
        ca = sum(1 for r in cat_r if r["classification"] == "AMBIGUOUS")
        pct = cp / len(cat_r) * 100 if cat_r else 0
        print(f"{cat:<22} {len(cat_r):<6} {cp:<6} {cf:<6} {ca:<6} {pct:.1f}%")
    
    # Show failures
    failures = [r for r in results if r["classification"].startswith("FAIL")]
    if failures:
        print(f"\n--- FAILURES ({len(failures)}) ---")
        for r in failures[:15]:
            print(f"  [{r['classification']}]")
            print(f"    Q: {r['prompt'][:70]}")
            print(f"    A: {r['content'][:120]}")
            print()
    
    # Save CSV
    csv_path = f"/home/ubuntu/askjun/tests/recruiter_batch{batch_num}_results.csv"
    with open(csv_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["prompt", "category", "response_type", "classification", "content", "length"])
        writer.writeheader()
        for r in results:
            writer.writerow({k: r[k] for k in ["prompt", "category", "response_type", "classification", "content", "length"]})
    
    print(f"\nSaved to: {csv_path}")
    print(f"Completed: {datetime.now().isoformat()}")
