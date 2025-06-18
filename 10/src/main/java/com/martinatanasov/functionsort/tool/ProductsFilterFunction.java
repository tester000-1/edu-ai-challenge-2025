package com.martinatanasov.functionsort.tool;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonPropertyDescription;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.ai.tool.annotation.Tool;

public class ProductsFilterFunction {

    @JsonProperty
    @JsonPropertyDescription("All products")
    private final JsonNode products;

    public ProductsFilterFunction(final JsonNode products) {
        this.products = products;
    }

    @Tool(name = "filterProducts",
            description = "Filters a list of products based on user preferences")
    public JsonNode filterProducts() {
        return products;
    }

}
