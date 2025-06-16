package com.martinatanasov.serviceanalizer;

import org.springframework.stereotype.Component;

@Component
public class AiPromptBuilder {

    public String buildPrompt(String input) {
        return """
                You are a product analyst. Create a comprehensive markdown-formatted report analyzing the following service or product:
                
                "%s"
                
                Your report must include the following sections:
                
                # Product Analysis: [Service Name]
                
                ## 1. Brief History
                - Founding year, key milestones, major changes or pivots
                
                ## 2. Target Audience
                - Primary user demographics or segments
                - Use cases or user needs addressed
                
                ## 3. Core Features
                - Top 2–4 features that define the product
                
                ## 4. Unique Selling Points (USPs)
                - What makes it different from competitors?
                
                ## 5. Business Model
                - How does the product generate revenue?
                
                ## 6. Tech Stack Insights
                - Technologies, integrations, or architecture details (where applicable)
                
                ## 7. Perceived Strengths
                - Highlighted advantages from user/business/tech perspectives
                
                ## 8. Perceived Weaknesses
                - Known issues, limitations, or trade-offs
                
                ## 9. SWOT Analysis
                - Strengths
                - Weaknesses
                - Opportunities
                - Threats
                """.formatted(input);
    }
}
