# 🧠 Emora System Design Diagrams

This document contains Mermaid diagrams illustrating the Architecture, Entity Relationships, and Pipeline Flow of the Emora Mental Health Chatbot backend.

---

## 📊 Entity Relationship (ER) Diagram

Below is the database schema mapping the entity relationships of the PostgreSQL database.

```mermaid
erDiagram
    roles ||--o{ users : "has"
    users ||--o{ conversations : "starts"
    users ||--o{ mood_logs : "records"
    users ||--o{ journals : "writes"
    users ||--o{ incidents : "triggers"
    users ||--o{ sentiment_logs : "logs"
    users ||--o{ notifications : "receives"
    conversations ||--o{ messages : "contains"
    conversations ||--o{ memories : "stores"
    messages ||--o{ sentiment_logs : "analyzes"

    roles {
        int id PK
        string name "User | Counselor | Admin"
        string description
    }

    users {
        int id PK
        string full_name
        string email
        string hashed_password
        string preferred_language
        string time_zone
        string mental_wellness_goal
        string emergency_contact
        int role_id FK
        datetime created_at
        datetime updated_at
    }

    conversations {
        int id PK
        int user_id FK
        string title
        string summary
        datetime created_at
        datetime updated_at
    }

    messages {
        int id PK
        int conversation_id FK
        string role "user | assistant | system"
        string content
        string sentiment
        string intent
        json source_citations
        bool is_crisis_triggered
        datetime created_at
    }

    memories {
        int id PK
        int conversation_id FK
        string memory_type "short_term | long_term | summary"
        string content
        datetime created_at
        datetime updated_at
    }

    mood_logs {
        int id PK
        int user_id FK
        int score "1-10"
        string mood_notes
        json emotions "array of emotions"
        datetime created_at
        datetime updated_at
    }

    journals {
        int id PK
        int user_id FK
        string content
        string ai_summary
        json emotions
        json keywords
        datetime created_at
        datetime updated_at
    }

    incidents {
        int id PK
        int user_id FK
        int conversation_id FK
        string message_content
        string risk_level "Low | Medium | High | Critical"
        string action_taken
        bool resolved
        string counselor_notes
        datetime created_at
        datetime updated_at
    }

    sentiment_logs {
        int id PK
        int user_id FK
        int conversation_id FK
        int message_id FK
        string sentiment
        float confidence_score
        datetime created_at
    }

    notifications {
        int id PK
        int user_id FK
        string title
        string content
        bool is_read
        datetime created_at
    }

    knowledge_documents {
        int id PK
        string title
        string author
        string source
        string file_name
        string file_path
        string content
        datetime upload_date
    }

    uploaded_files {
        int id PK
        string filename
        string file_path
        string content_type
        int size_bytes
        datetime created_at
    }
```

---

## 🛠️ Class & Architectural Layer Diagram

Emora follows a strict **Controller-Service-Repository** pattern. Database interactions occur strictly in Repositories. Business logic resides in Services. API Routing is handled in Versioned Routers.

```mermaid
classDiagram
    class APIRouter {
        +auth_router
        +users_router
        +chat_router
        +mood_router
        +journal_router
        +crisis_router
        +documents_router
    }

    class Services {
        +UserService
        +ChatService
        +MoodService
        +JournalService
        +CrisisService
        +DocumentService
        +RAGService
    }

    class Repositories {
        +UserRepository
        +ConversationRepository
        +MoodRepository
        +JournalRepository
        +CrisisRepository
        +DocumentRepository
    }

    class Models {
        +User
        +Role
        +Conversation
        +Message
        +Memory
        +MoodLog
        +Journal
        +Incident
        +SentimentLog
        +Notification
        +KnowledgeDocument
        +UploadedFile
    }

    APIRouter --> Services : Dependency Injection (Depends)
    Services --> Repositories : Orchestrates Data Transactions
    Repositories --> Models : CRUD on database models
    Services --> Models : Maps business entities
```

---

## 🔄 Sequence Diagram: End-to-End Chat & Agentic Pipeline

The diagram below details the sequence of execution when a client posts a new user message to the chat endpoint. It highlights how the message is validated, classified, contextualized, processed by specialist LLM agents via `LangGraph`, saved to SQL, indexed in ChromaDB, and streamed back using Event Source (SSE).

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant API as Chat Router (/chat/{id}/messages)
    participant Service as ChatService
    participant CrisisService as CrisisService
    participant Graph as LangGraph Workflow
    participant LLM as Groq API (Llama 3.1 8B)
    participant VectorDB as ChromaDB (nomic-embed)
    participant RDBMS as PostgreSQL (SQLAlchemy)

    Client->>API: POST /messages { "content": "I feel anxious" } (with Bearer Token)
    Note over API: Authenticates & verifies token
    API->>Service: stream_response(conversation_id, user_message, current_user)
    
    rect rgb(240, 248, 255)
        Note over Service, CrisisService: Crisis Analysis & Safety Classification
        Service->>CrisisService: assess_message(user_id, message)
        CrisisService->>LLM: Classify safety/distress level
        LLM-->>CrisisService: Returns safety validation JSON
        alt Crisis detected (High/Critical)
            CrisisService->>RDBMS: Save Incident Log (resolved = false)
            CrisisService-->>Service: Return crisis override response
            Service-->>Client: Stream SSE event & disconnect
        end
    end

    rect rgb(255, 245, 238)
        Note over Service, Graph: Agentic Pipeline Processing
        Service->>Graph: workflow.ainvoke(initial_state)
        
        Graph->>LLM: Intent & Sentiment Agents (Classifies message)
        LLM-->>Graph: { "intent": "anxiety", "sentiment": "Anxiety" }
        
        Graph->>RDBMS: Memory Agent (Fetch user preferences & short-term context)
        RDBMS-->>Graph: Returns previous conversation summaries & state
        
        Graph->>VectorDB: RAG Retrieval Agent (Query related wellness content)
        VectorDB-->>Graph: Returns relevant coping manual text chunks
        
        Graph->>LLM: CBT Agent (Formulates empathetic response + exercises)
        LLM-->>Graph: Returns wellness message text
        
        Graph->>LLM: Response Validation Agent (Check for medical advice / hallucinations)
        LLM-->>Graph: Returns validated/rewritten safe response
    end

    Service->>RDBMS: Save user message & assistant message to DB
    Service->>Client: Stream response tokens to Client (text/event-stream)
    Service-->>Client: Done event
```
