package hr.fer.zgcustoms.vehicles;

import java.math.BigDecimal;
import java.util.List;

import hr.fer.zgcustoms.accounts.Accounts;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {
    public record Vehicle(long id, String registration, String make, String model,
            int productionYear, int mileage) {}

    public record VehicleRegistration(
            @NotBlank @Size(max = 32) String registration,
            @NotBlank @Size(max = 100) String make,
            @NotBlank @Size(max = 100) String model,
            @NotNull @Positive @Max(Integer.MAX_VALUE) @Digits(integer = 10, fraction = 0)
            BigDecimal productionYear,
            @NotNull @PositiveOrZero @Max(Integer.MAX_VALUE) @Digits(integer = 10, fraction = 0)
            BigDecimal mileage) {}

    private final Accounts accounts;
    private final JdbcClient db;

    public VehicleController(Accounts accounts, JdbcClient db) {
        this.accounts = accounts;
        this.db = db;
    }

    @GetMapping
    public List<Vehicle> list(@AuthenticationPrincipal OidcUser identity) {
        long ownerId = activeOwnerId(identity, false);
        return db.sql("""
                SELECT id, registration, make, model, production_year, mileage FROM vehicles
                WHERE owner_id = ? AND archived_at IS NULL ORDER BY id
                """).param(ownerId).query(Vehicle.class).list();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public Vehicle register(@AuthenticationPrincipal OidcUser identity,
            @Valid @RequestBody VehicleRegistration input) {
        long ownerId = activeOwnerId(identity, true);
        return db.sql("""
                INSERT INTO vehicles (owner_id, registration, make, model, production_year, mileage)
                VALUES (?, ?, ?, ?, ?, ?)
                RETURNING id, registration, make, model, production_year, mileage
                """).params(ownerId, input.registration().strip(), input.make().strip(),
                        input.model().strip(), input.productionYear().intValueExact(), input.mileage().intValueExact())
                .query(Vehicle.class).single();
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void remove(@AuthenticationPrincipal OidcUser identity, @PathVariable long id) {
        long ownerId = activeOwnerId(identity, true);
        int archived = db.sql("""
                UPDATE vehicles SET archived_at = CURRENT_TIMESTAMP
                WHERE id = ? AND owner_id = ? AND archived_at IS NULL
                """).params(id, ownerId).update();
        if (archived == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
    }

    private long activeOwnerId(OidcUser identity, boolean lock) {
        var account = accounts.current(identity, lock);
        account.requireActive(Accounts.Role.OWNER);
        return account.id();
    }
}
