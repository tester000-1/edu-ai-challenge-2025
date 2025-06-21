package com.martinatanasov.sumarizeaudio.utils;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.martinatanasov.sumarizeaudio.model.AnalyticsResult;
import com.martinatanasov.sumarizeaudio.model.OutputFile;
import org.springframework.stereotype.Component;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;

@Component
public class FileWriter {

    public final String OUTPUT_FOLDER = "src/main/resources/output";
    private final ObjectMapper mapper = new ObjectMapper();

    public void createOrUpdateFile(final OutputFile outputFile, final String data) {
        try {
            Files.writeString(Path.of(OUTPUT_FOLDER + "/" + outputFile.getFullFilename()), data);
        } catch (Exception e) {
            e.printStackTrace();
            System.out.println("❌ Error: " + e);
        }
    }

    public void createOrUpdateJson(final AnalyticsResult data) {
        try {
            mapper.writerWithDefaultPrettyPrinter()
                    .writeValue(new File(OUTPUT_FOLDER + "/" + OutputFile.ANALYSIS.getFullFilename()), data);
        } catch (Exception e) {
            e.printStackTrace();
            System.out.println("❌ Error: " + e);
        }
    }

    public String insertNewlinesAtWordBoundaries(final String input, final int maxLineLength) {
        char[] chars = input.toCharArray();
        StringBuilder result = new StringBuilder();
        int lastBreak = 0;

        while (lastBreak + maxLineLength < chars.length) {
            int breakPoint = lastBreak + maxLineLength;

            // Search backward for nearest space
            while (breakPoint > lastBreak && chars[breakPoint] != ' ') {
                breakPoint--;
            }

            // If no space was found, just force break at maxLineLength
            if (breakPoint == lastBreak) {
                breakPoint = lastBreak + maxLineLength;
            }

            // Append from lastBreak to breakPoint
            result.append(chars, lastBreak, breakPoint - lastBreak).append("\n");

            // Skip the space if present
            lastBreak = (chars[breakPoint] == ' ') ? breakPoint + 1 : breakPoint;
        }

        // Append the rest
        result.append(chars, lastBreak, chars.length - lastBreak);

        return result.toString();
    }

}
