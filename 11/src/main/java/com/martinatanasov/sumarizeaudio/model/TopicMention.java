package com.martinatanasov.sumarizeaudio.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TopicMention {
    private String topic;
    private Long mentions;
}
