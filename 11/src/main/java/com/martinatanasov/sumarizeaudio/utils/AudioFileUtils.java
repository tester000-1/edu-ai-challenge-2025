package com.martinatanasov.sumarizeaudio.utils;

import com.github.kokorin.jaffree.ffprobe.FFprobe;
import com.github.kokorin.jaffree.ffprobe.FFprobeResult;
import com.github.kokorin.jaffree.ffprobe.Format;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Component
public class AudioFileUtils {

    @Value("${ffprobe.path.executable}")
    private String FFPROBE_PATH;

    public final String OUTPUT_AUDIO_FOLDER = "src/main/resources/static/audio";

    private final Set<String> VALID_AUDIO_EXTENSIONS = Set.of(
            "mp3", "mp4", "mpeg", "mpga", "m4a", "wav", "webm"
    );

    private final long MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

    public List<Path> getValidAudioFiles() throws IOException {
        Path directory = Paths.get(OUTPUT_AUDIO_FOLDER);

        if (!Files.exists(directory) || !Files.isDirectory(directory)) {
            throw new IllegalArgumentException("Directory does not exist: " + OUTPUT_AUDIO_FOLDER);
        }

        try (Stream<Path> files = Files.list(directory)) {
            return files
                    .filter(Files::isRegularFile)
                    .filter(path -> {
                        String filename = path.getFileName().toString().toLowerCase();
                        return VALID_AUDIO_EXTENSIONS.stream()
                                .anyMatch(ext -> filename.endsWith("." + ext));
                    })
                    .filter(path -> {
                        try {
                            return Files.size(path) <= MAX_FILE_SIZE_BYTES;
                        } catch (IOException e) {
                            System.out.println("\n❌ Failed to get file size: " + path);
                            return false;
                        }
                    })
                    .collect(Collectors.toList());
        }
    }

    public double getAudioDuration(final String fileName) {
        try {
            final File audioFile = new File(OUTPUT_AUDIO_FOLDER + "/" + fileName); // or mp3, webm, etc.
            final FFprobe ffprobe = new FFprobe(Path.of(FFPROBE_PATH)); // assumes ffprobe is in PATH

            final FFprobeResult result = ffprobe.setShowFormat(true)
                    .setInput(audioFile.getAbsolutePath())
                    .execute();

            final Format format = result.getFormat();
            final double duration = format.getDuration();

            return duration;
        } catch (Exception e) {
            return 0;
        }
    }

}