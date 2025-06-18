package com.martinatanasov.functionsort.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.martinatanasov.functionsort.tool.ProductsFilterFunction;
import com.martinatanasov.functionsort.util.JsonLoader;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.stereotype.Service;


@RequiredArgsConstructor
@Service
public class ProductSearchService {

    private final JsonLoader jsonLoader;
    private final ChatModel chatModel;

    public void runSearch(final String userInput) {
        try {
            final JsonNode products = jsonLoader.loadRawJsonArray("products.json");

            final String response = ChatClient.create(chatModel)
                    .prompt(userInput)
                    .tools(new ProductsFilterFunction(products))
                    .call()
                    .content();

            System.out.println("--- Filtered Products ---");
            System.out.println(response);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

