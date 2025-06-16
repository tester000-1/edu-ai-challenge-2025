package com.martinatanasov.serviceanalizer;


import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;

import java.util.Scanner;

@RequiredArgsConstructor
@Component
public class ConsoleChat{

    private final AiPromptBuilder promptBuilder;

    @Bean
    public CommandLineRunner runner(ChatClient.Builder builder) {
        // Initialize scanner
        final Scanner scanner = new Scanner(System.in);
        System.out.println("\tPlease enter a service name or text for analysis.");
        // Get the user's input
        final String userInput = scanner.nextLine().trim();
        // Add predefined text
        final String finalInput = promptBuilder.buildPrompt(userInput);
        scanner.close();

        return args -> {
            // Initialize chat client
            final ChatClient chatClient = builder.build();
            // Get the answer from the chat
            final String response = chatClient.prompt(finalInput).call().content();
            // Print the answer
            System.out.println(response + "\n");
            // Stop the application
            System.exit(0);
        };
    }

}
