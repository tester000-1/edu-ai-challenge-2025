package com.martinatanasov.sumarizeaudio.model;

import lombok.Getter;

import java.nio.file.Path;
import java.nio.file.Paths;

@Getter
public enum OutputFile {

    TRANSCRIPTION("transcription", "md"),
    SUMMARY("summary", "md"),
    ANALYSIS("analysis", "json");

    private final String filename;
    private final String extension;

    OutputFile(String filename, String extension) {
        this.filename = filename;
        this.extension = extension;
    }

    public String getFullFilename() {
        return filename + "." + extension;
    }

    public Path resolveInDirectory(Path directory) {
        return directory.resolve(getFullFilename());
    }

    public Path resolveInDirectory(String directory) {
        return Paths.get(directory).resolve(getFullFilename());
    }

    @Override
    public String toString() {
        return getFullFilename();
    }
}
