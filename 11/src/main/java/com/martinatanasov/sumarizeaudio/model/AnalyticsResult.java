package com.martinatanasov.sumarizeaudio.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AnalyticsResult {
    private Long word_count;
    private Long speaking_speed_wpm;
    private List<TopicMention> frequently_mentioned_topics;
}
