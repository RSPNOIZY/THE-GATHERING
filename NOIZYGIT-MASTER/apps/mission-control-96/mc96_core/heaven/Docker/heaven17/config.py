import os

class Config:
    PORT = int(os.getenv("PORT", 17017))
    OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
    DREAMCHAMBER_URL = os.getenv("DREAMCHAMBER_URL", "http://localhost:7777")
    PERSONA = os.getenv("PERSONA", "RSP")
    AI_MODEL = os.getenv("AI_MODEL", "noizy-gabriel-mind")
    VOICE_NAME = os.getenv("VOICE_NAME", "Gabriel")
    
    # Lucy persona override
    LUCY_MODEL = "noizy-family-keeper"
    LUCY_VOICE = "Lucy"
    
    @classmethod
    def is_lucy(cls) -> bool:
        return cls.PERSONA.lower() == "lucy"
    
    @classmethod
    def active_model(cls) -> str:
        return cls.LUCY_MODEL if cls.is_lucy() else cls.AI_MODEL
        
    @classmethod 
    def active_voice(cls) -> str:
        return cls.LUCY_VOICE if cls.is_lucy() else cls.VOICE_NAME
