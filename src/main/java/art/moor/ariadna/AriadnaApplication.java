package art.moor.ariadna;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class AriadnaApplication {

    public static void main(String[] args) {
        SpringApplication.run(AriadnaApplication.class, args);
    }

}
