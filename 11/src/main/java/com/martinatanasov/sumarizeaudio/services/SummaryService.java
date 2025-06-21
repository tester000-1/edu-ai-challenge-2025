package com.martinatanasov.sumarizeaudio.services;

import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.stereotype.Service;

@RequiredArgsConstructor
@Service
public class SummaryService {

    private final OpenAiChatModel chatModel;

    public String summarize(final String text) {
        final String promptText = "Summarize the following text in a clear and concise way, preserving the core intent and main takeaways:\n\n" + text;
        final Prompt prompt = new Prompt(promptText);
        final ChatResponse response = chatModel.call(prompt);
        return response.getResult().getOutput().getText();
    }
}
