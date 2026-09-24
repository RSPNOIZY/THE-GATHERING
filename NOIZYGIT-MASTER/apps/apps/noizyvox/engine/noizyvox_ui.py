#!/usr/bin/env python3
"""NOIZYVOX ENGINE - Web Interface"""
import gradio as gr
import torch
from pathlib import Path
from TTS.api import TTS

VOICES_DIR = Path.home() / "Documents/NOIZYVOX_ENGINE/voices"
OUTPUT_DIR = Path.home() / "Documents/NOIZYVOX_ENGINE/output"
VOICES_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

print("🔄 Loading XTTS v2...")
device = "mps" if torch.backends.mps.is_available() else "cpu"
tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to(device)
print(f"✅ Ready on {device}")

def get_voices():
    return [f.stem for f in VOICES_DIR.glob("*.wav")]

def clone_and_speak(audio_file, text, voice_name):
    if audio_file is None:
        return None, "❌ Please upload a voice sample"
    if not text:
        return None, "❌ Please enter text to speak"
    if not voice_name:
        voice_name = "my_voice"
    voice_path = VOICES_DIR / f"{voice_name}.wav"
    import shutil
    shutil.copy(audio_file, voice_path)
    output_path = OUTPUT_DIR / f"{voice_name}_output.wav"
    try:
        tts.tts_to_file(text=text, speaker_wav=str(voice_path), language="en", file_path=str(output_path))
        return str(output_path), f"✅ Generated with voice '{voice_name}'"
    except Exception as e:
        return None, f"❌ Error: {str(e)}"

def speak_existing(voice_name, text):
    voice_path = VOICES_DIR / f"{voice_name}.wav"
    if not voice_path.exists():
        return None, f"❌ Voice '{voice_name}' not found"
    output_path = OUTPUT_DIR / f"{voice_name}_output.wav"
    try:
        tts.tts_to_file(text=text, speaker_wav=str(voice_path), language="en", file_path=str(output_path))
        return str(output_path), "✅ Generated!"
    except Exception as e:
        return None, f"❌ Error: {str(e)}"

with gr.Blocks(title="NOIZYVOX Engine", theme=gr.themes.Soft()) as demo:
    gr.Markdown("# 🎤 NOIZYVOX ENGINE\n### Your Voice. Your Data. Your System.")
    with gr.Tab("🆕 Clone New Voice"):
        with gr.Row():
            with gr.Column():
                audio_input = gr.Audio(label="Upload Voice Sample (10-30 sec)", type="filepath")
                voice_name = gr.Textbox(label="Voice Name", placeholder="rob")
                text_input = gr.Textbox(label="Text to Speak", placeholder="Hello, this is my cloned voice!", lines=3)
                clone_btn = gr.Button("🎙️ Clone & Speak", variant="primary")
            with gr.Column():
                output_audio = gr.Audio(label="Generated Speech")
                status = gr.Textbox(label="Status")
        clone_btn.click(clone_and_speak, inputs=[audio_input, text_input, voice_name], outputs=[output_audio, status])
    with gr.Tab("🗣️ Use Existing Voice"):
        with gr.Row():
            with gr.Column():
                voice_dropdown = gr.Dropdown(label="Select Voice", choices=get_voices(), interactive=True)
                refresh_btn = gr.Button("🔄 Refresh Voices")
                text_input2 = gr.Textbox(label="Text to Speak", placeholder="Enter text here...", lines=3)
                speak_btn = gr.Button("🔊 Speak", variant="primary")
            with gr.Column():
                output_audio2 = gr.Audio(label="Generated Speech")
                status2 = gr.Textbox(label="Status")
        refresh_btn.click(lambda: gr.update(choices=get_voices()), outputs=[voice_dropdown])
        speak_btn.click(speak_existing, inputs=[voice_dropdown, text_input2], outputs=[output_audio2, status2])
    gr.Markdown("---\n### 🔥 GORUNFREE | NOIZYVOX by Rob Plowman")

if __name__ == "__main__":
    demo.launch(server_port=8421, share=False)
