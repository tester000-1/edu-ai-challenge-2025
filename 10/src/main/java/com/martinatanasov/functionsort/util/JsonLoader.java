package com.martinatanasov.functionsort.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;

@Component
public class JsonLoader {

    private final ObjectMapper objectMapper = new ObjectMapper();

    public JsonNode loadRawJsonArray(String fileName) {
        try (InputStream inputStream = new ClassPathResource(fileName).getInputStream()) {
            return objectMapper.readTree(inputStream); // returns JsonNode (JSON array)
        } catch (IOException e) {
            throw new RuntimeException("Failed to load raw JSON", e);
        }
    }

}
