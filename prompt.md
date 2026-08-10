# Backend Implementation Prompt

You are a Senior AI Engineer, Senior Backend Engineer, and Software Architect.

Build a **clean, modular, enterprise-quality backend** for my **AI-Driven Agentic Mental Health Support Chatbot**.

This is a **Final Year Project** that will run **only on my local computer**. Do **not** implement cloud deployment, production infrastructure, or paid services.

The code should emphasize clean architecture, maintainability, readability, and AI engineering best practices rather than production scalability.

---

# Technology Stack (Use Only These Technologies)

## Programming Language

* Python 3.13+

## Backend Framework

* FastAPI

## AI Framework

* LangGraph

##  LLM

* model: Llama 3.1 8B Instruct 
* **LLM Provider:** Groq API (Free Tier)

## Embedding Model

* nomic-embed-text

## Vector Database

* ChromaDB

## Relational Database

* PostgreSQL

## ORM

* SQLAlchemy 2.0 (Async)

## Database Migration

* Alembic

## Authentication

* JWT Authentication

## Validation

* Pydantic v2

## Environment Variables

* python-dotenv

## Package Manager

* uv

## API Documentation

* Swagger UI

## Testing

* Pytest

## Logging

* Structlog

## File Storage

* Local File Storage

---

# Technologies NOT to Use

Do NOT use:

* OpenAI API
* Anthropic API
* Gemini API
* Pinecone
* FAISS
* Redis
* Celery
* Docker
* Docker Compose
* Kubernetes
* AWS
* Azure
* GCP
* S3
* Prometheus
* Grafana
* CI/CD
* Cloud Deployment

Everything must work completely offline on my local computer except downloading the Ollama models.

---

# Project Goal

Develop an AI-driven mental health support chatbot that provides:

* empathetic conversations
* CBT-based guidance
* mindfulness exercises
* grounding techniques
* journaling assistance
* mood tracking
* emotion detection
* crisis detection
* Retrieval-Augmented Generation (RAG)
* conversation memory
* evidence-based responses from trusted mental health resources

The chatbot must clearly state that it is an AI assistant and not a licensed mental health professional.

The chatbot must never diagnose illnesses or prescribe medication.

---

# Software Architecture

Follow:

* Clean Architecture
* SOLID Principles
* Repository Pattern
* Service Layer Pattern
* Domain-Driven Design
* Modular Folder Structure
* Dependency Injection
* Async Programming

---

# Folder Structure

app/

api/

core/

config/

database/

models/

schemas/

repositories/

services/

agents/

rag/

guardrails/

sentiment/

crisis/

memory/

prompts/

security/

utils/

tests/

main.py

---

# Authentication Module

Implement:

* User Registration
* User Login
* JWT Authentication
* Password Hashing
* Role-Based Access

Roles:

* User
* Counselor
* Admin

---

# User Module

Store:

* Full Name
* Email
* Password
* Preferred Language
* Time Zone
* Mental Wellness Goal
* Emergency Contact (Optional)

---

# Chat Module

Implement:

* Start Conversation
* Continue Conversation
* Conversation History
* Streaming AI Responses
* Conversation Search
* Conversation Summary
* Delete Conversation

---

# Agentic AI System

Use LangGraph to build an agent workflow.

Create the following agents:

* Router Agent
* Conversation Agent
* CBT Agent
* Journaling Agent
* Mood Tracking Agent
* Sentiment Analysis Agent
* Intent Classification Agent
* Crisis Detection Agent
* RAG Retrieval Agent
* Guardrail Agent
* Memory Agent
* Response Validation Agent
* Response Generator Agent

Each agent must be implemented in its own file with a clear responsibility.

---

# Prompt Engineering

Store prompts separately in the prompts folder.

Examples:

* system_prompt.py
* cbt_prompt.py
* crisis_prompt.py
* journal_prompt.py
* guardrail_prompt.py

Do not hard-code prompts inside business logic.

---

# RAG System

Implement a complete local RAG pipeline.

Support:

* PDF
* DOCX
* TXT
* Markdown

Use:

* Recursive Character Text Splitter
* nomic-embed-text embeddings
* ChromaDB

Implement:

* Document ingestion
* Chunking
* Embedding generation
* Similarity search
* Metadata filtering
* Source citation

Every AI response generated from the knowledge base must include its source.

---

# Knowledge Base

Allow administrators to upload trusted resources such as:

* CBT manuals
* WHO mental health documents
* University counseling resources
* Psychology textbooks

Store metadata:

* Title
* Author
* Source
* Upload Date
* File Name

---

# Conversation Memory

Implement:

* Short-Term Memory
* Long-Term Memory
* Conversation Summary Memory

Store memory in PostgreSQL.

---

# Mood Tracking

Implement:

* Daily Mood Logging
* Weekly History
* Monthly History
* Mood Notes
* Mood Trends

---

# Journal Module

Implement:

* Daily Journal
* AI Journal Summary
* Emotion Extraction
* Keyword Extraction

---

# Sentiment Analysis

Detect:

* Happiness
* Sadness
* Anxiety
* Stress
* Anger
* Fear
* Burnout
* Loneliness

Return a confidence score.

---

# Intent Detection

Recognize:

* Greeting
* General Question
* Mood Logging
* Journal Entry
* Advice Request
* Crisis Situation
* Stress
* Anxiety
* Academic Pressure
* Relationship Issues

---

# Crisis Detection

Detect:

* Self-Harm
* Suicide Risk
* Violence
* Severe Emotional Distress

Classify:

* Low
* Medium
* High
* Critical

For High or Critical risk:

* Stop normal conversation.
* Display emergency guidance.
* Recommend contacting a trusted person or local emergency services.
* Save a crisis incident for counselor review.

---

# Guardrails

Implement:

* Prompt Injection Detection
* Jailbreak Detection
* Unsafe Content Detection
* Hallucination Prevention
* Medical Advice Prevention
* Delusion Validation Prevention
* PII Detection
* Output Validation

---

# Security

Implement:

* Password Hashing
* JWT Authentication
* SQL Injection Protection
* CORS
* Input Validation
* Secure File Upload Validation
* Audit Logging

---

# API Endpoints

/api/v1/auth

/api/v1/users

/api/v1/chat

/api/v1/messages

/api/v1/rag

/api/v1/mood

/api/v1/journal

/api/v1/documents

/api/v1/crisis

---

# Database Models

User

Role

Conversation

Message

Memory

MoodLog

Journal

KnowledgeDocument

UploadedFile

Incident

SentimentLog

Notification

---

# Documentation

Generate:

* README.md
* Installation Guide
* API Documentation (Swagger)
* ER Diagram
* Sequence Diagram
* Class Diagram
* Project Structure Documentation

---

# Coding Standards

Requirements:

* Fully asynchronous code
* Type hints everywhere
* Clean Architecture
* Repository Pattern
* Service Layer
* Comprehensive comments
* Proper exception handling
* Reusable utilities
* Consistent naming conventions
* Modular design

Generate the backend one module at a time. Complete and test each module before moving to the next. Do not skip steps or generate placeholder code.

