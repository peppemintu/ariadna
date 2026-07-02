package art.moor.ariadna.service;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static art.moor.ariadna.service.CardService.midpoint;
import static org.assertj.core.api.Assertions.assertThat;

public class CardServiceMidpointTest {

    @ParameterizedTest(name = "midpoint({0}, {1}) = {2}")
    @CsvSource(
            value = {
                "1000.0, 1500.0, 1250.0",
                "null, 1500.0, 750.0",
                "1000.0, null, 2000.0",
                "null, null, 1000.0"
            },
            nullValues = {"null"}
    )
    void midpoint_returnsExpectedPosition(Double prev, Double next, double expected) {
        assertThat(midpoint(prev, next)).isEqualTo(expected);
    }

}
