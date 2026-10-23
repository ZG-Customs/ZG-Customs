package hr.fer.zgcustoms;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(properties = {
    "spring.datasource.url=${TEST_DATABASE_URL:jdbc:postgresql://localhost:55432/zg_customs_test}",
    "spring.datasource.username=${TEST_DATABASE_USER:zg_customs_test}",
    "spring.datasource.password=${TEST_DATABASE_PASSWORD:test-only-password}"
})
class BackendIntegrationTests {
    @LocalServerPort
    private int port;

    @Autowired
    private JdbcTemplate jdbc;

    private final HttpClient client = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5)).build();

    @Test
    void catalogIsReadFromMigratedPostgresDatabase() throws Exception {
        var response = get("/api/service-types");
        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.body()).contains("REGULAR_SERVICE", "TIRE_CHANGE", "BRAKE_REPAIR", "DIAGNOSTICS");
        assertThat(jdbc.queryForObject("SELECT count(*) FROM service_types", Long.class)).isEqualTo(4L);
        assertThat(jdbc.queryForObject("SELECT version()", String.class)).startsWith("PostgreSQL");
    }

    @Test
    void databaseRejectsDuplicateServiceCodes() {
        assertThatThrownBy(() -> jdbc.update("""
                INSERT INTO service_types (code, name, description)
                VALUES ('REGULAR_SERVICE', 'Duplicate', 'Must fail')
                """))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void readinessChecksDatabaseWithoutExposingDetails() throws Exception {
        var response = get("/actuator/health/readiness");
        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.body()).contains("\"status\":\"UP\"").doesNotContain("jdbc:", "password", "components");
    }

    @Test
    void catalogDoesNotExposeUnauthenticatedWrites() throws Exception {
        var response = client.send(HttpRequest.newBuilder(uri("/api/service-types"))
                .timeout(Duration.ofSeconds(10))
                .POST(HttpRequest.BodyPublishers.ofString("{}"))
                .header("Content-Type", "application/json").build(), HttpResponse.BodyHandlers.ofString());
        assertThat(response.statusCode()).isEqualTo(405);
        assertThat(get("/actuator/env").statusCode()).isEqualTo(404);
    }

    private HttpResponse<String> get(String path) throws Exception {
        return client.send(HttpRequest.newBuilder(uri(path)).timeout(Duration.ofSeconds(10)).GET().build(),
                HttpResponse.BodyHandlers.ofString());
    }

    private URI uri(String path) {
        return URI.create("http://localhost:" + port + path);
    }
}
