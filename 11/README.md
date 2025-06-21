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

🔧 Setup
1. Clone the Repository

```bash
git clone https://github.com/your-org/audio-transcript-summarizer.git
cd audio-transcript-summarizer
```

2. Install FFmpeg Executable
   The app requires the ffprobe executable (part of FFmpeg) for audio file processing.

✅ Recommended Download Sources:
[github/releases](https://github.com/BtbN/FFmpeg-Builds/releases)

Or official website
[website](https://ffmpeg.org/download.html)

📦 Installation Instructions by OS:
Windows

1. Download a win64 static or shared build from the BtbN or FFmpeg site.
2. Extract the archive (e.g., to D:/ffmpeg-master-latest-win64-gpl-shared).
3. Note the full path to ffprobe.exe inside the /bin directory.

macOS
```bash
brew install ffmpeg
```

Linux (Debian/Ubuntu)
```bash
sudo apt update
sudo apt install ffmpeg
```

## Configure the FFprobe Path

> [!IMPORTANT]  
> Set up ffprobe path inside the application.properties before execution!

Open the following file: src/main/resources/application.properties

Set the path to the ffprobe executable using the following property:

```properties
ffprobe.path.executable=D:/ffmpeg-master-latest-win64-gpl-shared/bin/ffprobe
```

### Clone the repository

```bash
git clone https://github.com/tester000-1/edu-ai-challenge-2025/tree/master/11.git
cd edu-ai-challenge-2025/11/
```

### Run the application

Inside project's folder runs the required script with your API key instead of <enter_your_api_key>

bash
```bash
./mvnw spring-boot:run -Dspring-boot.run.jvmArguments="-Dspring.ai.openai.api-key=<enter_your_api_key>"
```

cmd
```cmd
mvnw spring-boot:run -Dspring-boot.run.jvmArguments="-Dspring.ai.openai.api-key=<enter_your_api_key>"
```

## ▶️ How the Application Works

After launching, the application guides you through selecting an audio file, transcribing it, summarizing it, and analyzing it. Here's how it works:

### 🗂 Audio File Discovery

* The application scans the following folder for audio files:

  ```
  src/main/resources/static/audio
  ```

* Only **valid audio files** are displayed. A file is considered valid if it:

  * Is **25MB or smaller**
  * Has one of the following extensions:

    * `.mp3`, `.mp4`, `.mpeg`, `.mpga`, `.m4a`, `.wav`, `.webm`

* Any file that doesn't meet these criteria will be **ignored** and **not shown** in the prompt.
For more details visit [official documentation](https://platform.openai.com/docs/guides/speech-to-text)

### 🎧 2. File Selection Prompt

At startup, the console displays a numbered list of valid audio files found in the directory:

```plaintext
Available Audio Files:
1. meeting_clip.wav
2. keynote_address.mp3
3. user_interview.m4a

Please enter the index of the audio file to process:
1

Total Words: 1324
Speaking Speed: 118 wpm

SUMMARY
This presentation covers recent advancements in AI...

Top Topics:
- AI: 20 times
- Innovation: 12 times
- Ethics: 6 times
```

You select the file by typing its index number (e.g., `1`).

---

### 📝 Transcription

* The selected audio file is uploaded to the **OpenAI Whisper API** for transcription.
* The response includes a full text version of the audio content.

---

### 💬 Summarization

* The transcription is passed to a GPT model (via **Spring AI**) to generate a concise summary of the audio content.

---

### 📊 Analytics & Statistics

The app processes the transcription to extract:

* **Total Word Count**
* **Speaking Speed** (words per minute)
* **Frequently Mentioned Topics** (with counts)


---

OpenAI data is stored at: (`src/main/resources/output`):

