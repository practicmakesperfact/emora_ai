AI-Driven "Agentic" Mental Health Support Chatbot 
Brief Introduction: A sophisticated chatbot that uses Generative AI to provide empathetic 
conversation, basic cognitive behavioral therapy (CBT) exercises, and crisis detection. 
• Existing Problems: Human therapy is expensive and often has long wait times; current 
rule-based chatbots feel cold and repetitive. 
• Methodology: Rapid Application Development (RAD). Implement RAG (Retrieval
Augmented Generation) to ensure the AI provides evidence-based psychological advice 
rather than "hallucinating" facts. 
• Hardware: High-RAM workstation for local model testing or Cloud GPU (e.g., Hugging 
Face Spaces). 
• Software Tools: Python, LangChain (for RAG), OpenAI API or Llama 3 (LLM), Next.js 
(Frontend), Tailwind CSS. 
Detailed showcases 
Problem Landscape & Solutions Table 
Existing Problem 
Severity Proposed Technical/Policy 
Solution 
Hallucination & Harmful 
Advice (e.g., suggesting self
harm or inappropriate meds) 
Critical 
Key 
Stakeholders 
Implement RAG (Retrieval
Augmented Generation) with a 
"Gold Standard" clinical 
database. Use Guardrail Layers 
(e.g., NeMo Guardrails) to filter 
outputs. 
Crisis Detection Failure 
(Missing cues for suicide 
ideation or severe psychosis) 
Critical 
Clinical 
Psychologists, 
AI Safety 
Engineers 
Develop a Multi-tier Triage 
System. Use a secondary 
"Sentiment & Intent" model to 
monitor the conversation in real
time and trigger immediate 
human escalation/hotline links. 
Emergency 
Services, 
Software 
Developers 
Existing Problem Severity Proposed Technical/Policy 
Solution 
Key 
Stakeholders 
Deceptive Empathy & 
Dependency (Users forming 
pathological bonds with a bot 
that doesn't "feel") 
High 
Mandatory Transparency 
Disclosures (e.g., "I am an AI, 
not a human"). Limit daily 
session lengths to prevent 
unhealthy emotional attachment. 
Ethicists, UI/UX 
Designers, Users 
Algorithmic Bias (Poor 
performance for non-Western 
cultures or marginalized 
groups) 
High 
Diverse Dataset Curation 
including Amharic, Ge'ez, or 
other regional linguistic nuances. 
Conduct "Adversarial Testing" 
for cultural sensitivity. 
Linguistic 
Experts, Data 
Scientists 
Data Privacy & Security 
(Leaks of highly sensitive 
personal trauma data) 
High 
Zero-Knowledge Encryption 
and local/edge processing where 
possible. Compliance with 
GDPR, HIPAA, or local 
equivalents (e.g., Ethiopia's Data 
Protection laws). 
Cybersecurity 
Experts, Legal 
Teams 
Over-Validation of Delusions 
(Agreeing with a user's 
paranoia/hallucinations) 
Medium
High 
Use Prompt Engineering and 
"Chain-of-Thought" reasoning to 
teach the agent to identify and 
gently pivot away from 
validating clinical delusions. 
Psychiatrists, 
Prompt 
Engineers 
 
Detailed Stakeholder Analysis 
1. Primary Users (Patients/Students): The core group seeking support. Their primary 
concern is accessibility, anonymity, and immediate relief. 
2. Clinical Professionals (Psychologists/Psychiatrists): They act as "Subject Matter 
Experts" (SMEs). Their role is to validate the AI’s CBT/DBT scripts and ensure the bot 
follows evidence-based practices. 
3. Software Engineering Team: Responsible for the Agentic Framework (using tools like 
LangChain or AutoGPT), ensuring the system can "think" before it "speaks." 
4. Regulatory Bodies (Ministry of Health/Ethicists): Responsible for setting the "Rules of 
Engagement" and ensuring the software doesn't overstep into "unlicensed medical 
practice." 
5. Data Privacy Officers: Stakeholders focused on the "Digital Footprint" of the user, 
ensuring that "what is said in the chat, stays in the chat." 
Project Tip for Your Undergraduate Submission: 
To make your project stand out, don't just build a "chatbot." Build a "Human-in-the-Loop" 
(HITL) System. 
• The Feature: If the AI detects a "High Severity" score ($S > 8/10$) during sentiment 
analysis, it automatically pings a dashboard monitored by a human counselor.