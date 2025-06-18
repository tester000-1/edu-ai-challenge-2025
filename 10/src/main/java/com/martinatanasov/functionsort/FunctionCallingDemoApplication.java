package com.martinatanasov.functionsort;

import com.martinatanasov.functionsort.service.ProductSearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.Scanner;


@RequiredArgsConstructor
@SpringBootApplication
public class FunctionCallingDemoApplication implements CommandLineRunner {

	public static void main(String[] args) {
		SpringApplication.run(FunctionCallingDemoApplication.class, args);
	}

	private final ProductSearchService service;


	@Override
	public void run(String[] args) {
		final Scanner scanner = new Scanner(System.in);
		System.out.println("\tEnter your product search request: ");
		final String input = scanner.nextLine();
		scanner.close();
		service.runSearch(input);
		System.exit(0);
	}

}
