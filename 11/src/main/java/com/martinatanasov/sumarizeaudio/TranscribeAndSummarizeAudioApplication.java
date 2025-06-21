package com.martinatanasov.sumarizeaudio;

import com.martinatanasov.sumarizeaudio.model.AnalyticsResult;
import com.martinatanasov.sumarizeaudio.model.OutputFile;
import com.martinatanasov.sumarizeaudio.model.TopicMention;
import com.martinatanasov.sumarizeaudio.services.AnalyticsService;
import com.martinatanasov.sumarizeaudio.services.SummaryService;
import com.martinatanasov.sumarizeaudio.services.TranscriptionService;
import com.martinatanasov.sumarizeaudio.utils.AudioFileUtils;
import com.martinatanasov.sumarizeaudio.utils.FileWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.File;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.List;
import java.util.Scanner;


@RequiredArgsConstructor
@SpringBootApplication
public class TranscribeAndSummarizeAudioApplication implements CommandLineRunner {

	private final AnalyticsService analyticsService;
	private final SummaryService summaryService;
	private final TranscriptionService transcriptionService;
	private final AudioFileUtils audioFileUtils;
	private final FileWriter fileWriter;
	private final String ERROR_MESSAGE = "", ERROR_MESSAGE_INDEX = "";

	public static void main(String[] args) {
		SpringApplication.run(TranscribeAndSummarizeAudioApplication.class, args);
	}

	@Override
	public void run(String... args) throws Exception {
		boolean isEnabledStorageMode = false;
		final Scanner sc = new Scanner(System.in);
		final List<Path> records = audioFileUtils.getValidAudioFiles();
		if (records != null && records.size() > 0 ) {
			isEnabledStorageMode = true;
			System.out.println("\nSelect audio record index");
			for (int i = 0; i < records.size(); i++) {
				System.out.println((i + 1) +". " + records.get(i).getFileName());
			}
		}
		Integer select;
		String input;
		// Ask user for valid file index
		while (true) {
			input = sc.nextLine();

			if (isValidFilepath(input)) {
				select = null;
				break;
			}

			try {
				select = Integer.parseInt(input.trim());
				if (isEnabledStorageMode && (select >= 1 && select <= records.size())) {
					break; // Exit loop if parsing succeeds
				} else {
					System.out.println("❌ Invalid input. Please enter a valid index.");
				}
			} catch (NumberFormatException e) {
				System.out.println("❌ Invalid input. Please enter a valid index.");
			}
		}
		String transcription, summary;
		if (select != null || input != null) {
			try {
				final String fileName = select == null ? input : "static/audio/" + records.get(select - 1).getFileName();

				System.out.println("\nSelected file: " + records.get(select - 1) + "\n");
				transcription = transcriptionService.transcribe("static/audio/" + records.get(select - 1).getFileName());
				fileWriter.createOrUpdateFile(OutputFile.TRANSCRIPTION, transcription);

				summary = summaryService.summarize(transcription);

				fileWriter.createOrUpdateFile(OutputFile.SUMMARY, summary);

        		AnalyticsResult analytics = analyticsService.analyze(transcription,
						records.get(select - 1).getFileName().toString());
				fileWriter.createOrUpdateJson(analytics);

				// Summary
        		System.out.println("\nSUMMARY:\n");
				System.out.println(fileWriter.insertNewlinesAtWordBoundaries(summary, 80));
				System.out.println("\nTop 3 Frequently Mentioned Topics:\n");
				analytics.getFrequently_mentioned_topics().stream()
						.sorted(Comparator.comparingLong(TopicMention::getMentions).reversed())
						.limit(3)
						.forEach(t -> System.out.printf("- %s (%d mentions)%n", t.getTopic(), t.getMentions()));
			} catch (Exception e) {
				System.out.println("Wrong input! Please try again.");
			}
		}

		quit();
	}



	private boolean isValidFilepath(final String filePath) {
		final File file = new File(filePath);
		if (!file.exists()) {
			return false;
		} else if (!file.isFile()) {
			return false;
		} else if (!file.canRead()) {
			return false;
		} else {
			return true;
		}
	}

	private void quit() {
		System.exit(0);
	}

}
