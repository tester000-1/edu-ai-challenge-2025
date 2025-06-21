# Audio Analyzer Console App

A cross-platform Java console application that accepts a spoken audio file, transcribes it using OpenAI's Whisper API, summarizes it using OpenAI GPT models, and extracts useful statistics like word count, speaking speed, and topic frequency. Results are saved to a file and displayed in the console.

## 📋 Features

- Accepts audio files (mp3, mp4, mpeg, mpga, m4a, wav, and webm) with size limit 25mgb https://platform.openai.com/docs/guides/speech-to-text
- Uses OpenAI Whisper API for transcription
- Summarizes transcription with OpenAI GPT (via Spring AI)
- Extracts key analytics:
    - Total word count
    - Speaking speed (words per minute)
    - Frequently mentioned topics and their counts
- Saves each transcription and result in a separate file (inside 'src/main/resources/output' directory)
- Displays summary and analytics in console output

## 🚀 Requirements

- **Java:** 17 or higher (OpenJDK recommended)
- **Maven:** 3.8+
- **OS:** Compatible with macOS, Windows, and Linux
- **OpenAI API Key:** Required for Whisper and GPT access
- **Jaffree Library:** For FFmpeg integration (used internally)

## 🧰 Dependencies

- [Spring Boot](https://spring.io/projects/spring-boot)
- [Spring AI](https://docs.spring.io/spring-ai/reference/)
- [OpenAI Whisper API](https://platform.openai.com/docs/guides/speech-to-text)
- [OpenAI GPT Models (Chat Completions)](https://platform.openai.com/docs/guides/gpt)
- [Jaffree](https://github.com/kokorin/Jaffree): Java interface to FFmpeg for media processing

## 🚀 How to Run

```bash
# Set your OpenAI API Key
export OPENAI_API_KEY=your_api_key

# Build the project
mvn clean install

# Run the application with audio file
java -jar target/audio-analyzer-1.0.jar path/to/audio.mp3