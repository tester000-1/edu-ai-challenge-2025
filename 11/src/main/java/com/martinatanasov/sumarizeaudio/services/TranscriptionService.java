package com.martinatanasov.sumarizeaudio.services;

import lombok.RequiredArgsConstructor;
import org.springframework.ai.openai.OpenAiAudioTranscriptionModel;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;


@RequiredArgsConstructor
@Service
public class TranscriptionService {

    private final OpenAiAudioTranscriptionModel transcriptionModel;

    public String transcribe(final String filePath) {
        final Resource audioResource = new ClassPathResource(filePath);
        return transcriptionModel.call(audioResource);
    }

}
