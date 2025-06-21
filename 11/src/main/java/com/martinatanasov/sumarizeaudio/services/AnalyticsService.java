package com.martinatanasov.sumarizeaudio.services;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.martinatanasov.sumarizeaudio.model.AnalyticsResult;
import com.martinatanasov.sumarizeaudio.model.TopicMention;
import com.martinatanasov.sumarizeaudio.utils.AudioFileUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.List;

@RequiredArgsConstructor
@Service
public class AnalyticsService {

    private final AudioFileUtils audioFileUtils;
    private final OpenAiChatModel chatModel;

    public AnalyticsResult analyze(final String text, final String fileName){
        // Get word count
        final long wordCount = getWordCount(text);
        // Get duration in seconds
        final double durationInSeconds = getAudioDuration(fileName);
        // Calculate wmp based on duration and word count
        final long wpm = getDurationInSeconds(wordCount, durationInSeconds);
        // Get top 3 topics
        final List<TopicMention> topics = getTopMentions(text);
        // Return a new AnalyticsResult
        return new AnalyticsResult(wordCount, wpm, topics);
    }

    private double getAudioDuration(final String fileName) {
        return audioFileUtils.getAudioDuration(fileName);
    }

    private long getDurationInSeconds(long wordCount, double durationInSeconds) {
        final long wpm = (long) durationInSeconds == 0 ? 0:(long)(wordCount / (durationInSeconds / 60.0));
        if ((long) durationInSeconds != 0) {
            System.out.println("Duration wpm: " + wpm);
        } else {
            System.out.println("❌ The executable path for ffprobe is not set! The value for wpm cannot be calculated");
        }
        return wpm;
    }

    private int getWordCount(final String text) {
        final int wordCount = text.split("\\s+").length;
        System.out.println("Words: " + wordCount);
        return wordCount;
    }

    private List<TopicMention> getTopMentions(final String text) {
        final String promptText = """
            Extract the top 3 most frequently mentioned topics from the following text.
            Answer in pure JSON array format where each item has "topic" and "mentions" integer.

            TEXT:
            %s
            """.formatted(text);
        final Prompt prompt = new Prompt(promptText);
        final ChatResponse response = chatModel.call(prompt);

        // Extract the response text from the first generation
        final String jsonOutput = response.getResults()
                .get(0)
                .getOutput()
                .getText()
                .replaceAll("(?s)```json|```", "").trim();

        // Parse directly into List<TopicMention>
        try {
            final ObjectMapper mapper = new ObjectMapper();
            return mapper.readValue(jsonOutput, new TypeReference<List<TopicMention>>() {});
        } catch (IOException e) {
            throw new RuntimeException("Failed to parse topic mentions from response: " + jsonOutput, e);
        }
    }

}
