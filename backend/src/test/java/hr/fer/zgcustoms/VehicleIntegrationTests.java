package hr.fer.zgcustoms;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oidcLogin;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.List;

import hr.fer.zgcustoms.accounts.Accounts;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

@SpringBootTest
@Transactional
@TestPropertySource(properties = {
    "spring.datasource.url=${TEST_DATABASE_URL:jdbc:postgresql://localhost:55432/zg_customs_test}",
    "spring.datasource.username=${TEST_DATABASE_USER:zg_customs_test}",
    "spring.datasource.password=${TEST_DATABASE_PASSWORD:test-only-password}"
})
class VehicleIntegrationTests {
    private static final String VEHICLES = "/api/vehicles";
    private static final String REGISTRATION = """
            {"registration":"ZG 1234 AB","make":"Ford","model":"Focus","productionYear":2020,"mileage":50000}
            """;

    @Autowired WebApplicationContext context;
    @Autowired Accounts accounts;
    @Autowired JdbcClient db;
    MockMvc mvc;

    @BeforeEach
    void configureMvc() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    @Test
    void ownerCanRegisterListAndArchiveAVehicleWithBookingHistory() throws Exception {
        var owner = account("owner", Accounts.Role.OWNER);
        var other = account("other", Accounts.Role.OWNER);
        var manager = account("manager", Accounts.Role.MANAGER);

        mvc.perform(get(VEHICLES).with(oidcLogin().oidcUser(owner)))
                .andExpect(status().isOk()).andExpect(jsonPath("$").isEmpty());
        mvc.perform(post(VEHICLES).with(oidcLogin().oidcUser(owner)).with(csrf())
                .contentType("application/json").content(REGISTRATION))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.registration").value("ZG 1234 AB"));
        long vehicleId = db.sql("SELECT id FROM vehicles WHERE owner_id = ?")
                .param(accounts.current(owner, false).id()).query(Long.class).single();
        mvc.perform(get(VEHICLES).with(oidcLogin().oidcUser(owner)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(vehicleId))
                .andExpect(jsonPath("$[0].registration").value("ZG 1234 AB"))
                .andExpect(jsonPath("$[0].make").value("Ford"))
                .andExpect(jsonPath("$[0].model").value("Focus"))
                .andExpect(jsonPath("$[0].productionYear").value(2020))
                .andExpect(jsonPath("$[0].mileage").value(50000));
        mvc.perform(get(VEHICLES).with(oidcLogin().oidcUser(other)))
                .andExpect(status().isOk()).andExpect(jsonPath("$").isEmpty());
        mvc.perform(delete(VEHICLES + "/{id}", vehicleId).with(oidcLogin().oidcUser(other)).with(csrf()))
                .andExpect(status().isNotFound());

        long workshopId = db.sql("INSERT INTO workshops (manager_id, name) VALUES (?, 'Garage') RETURNING id")
                .param(accounts.current(manager, false).id()).query(Long.class).single();
        long bookingId = db.sql("""
                INSERT INTO bookings (vehicle_id, workshop_id, service_type_id, requested_at, status)
                SELECT ?, ?, id, CURRENT_TIMESTAMP, 'CONFIRMED' FROM service_types WHERE code = 'REGULAR_SERVICE'
                RETURNING id
                """).params(vehicleId, workshopId).query(Long.class).single();
        mvc.perform(delete(VEHICLES + "/{id}", vehicleId).with(oidcLogin().oidcUser(owner)))
                .andExpect(status().isForbidden());
        mvc.perform(delete(VEHICLES + "/{id}", vehicleId).with(oidcLogin().oidcUser(owner)).with(csrf()))
                .andExpect(status().isNoContent()).andExpect(content().string(""));
        mvc.perform(get(VEHICLES).with(oidcLogin().oidcUser(owner)))
                .andExpect(status().isOk()).andExpect(jsonPath("$").isEmpty());
        mvc.perform(delete(VEHICLES + "/{id}", vehicleId).with(oidcLogin().oidcUser(owner)).with(csrf()))
                .andExpect(status().isNotFound());
        assertThat(db.sql("""
                SELECT v.registration FROM bookings b JOIN vehicles v ON v.id = b.vehicle_id
                WHERE b.id = ? AND v.id = ? AND v.archived_at IS NOT NULL AND b.status = 'CONFIRMED'
                """).params(bookingId, vehicleId).query(String.class).single()).isEqualTo("ZG 1234 AB");
    }

    @Test
    void allVehicleActionsRequireAnActiveOwner() throws Exception {
        mvc.perform(get(VEHICLES)).andExpect(status().isUnauthorized());
        mvc.perform(post(VEHICLES).with(csrf()).contentType("application/json").content(REGISTRATION))
                .andExpect(status().isUnauthorized());
        mvc.perform(delete(VEHICLES + "/1").with(csrf())).andExpect(status().isUnauthorized());

        var mechanic = account("mechanic", Accounts.Role.MECHANIC);
        var inactive = account("inactive", Accounts.Role.OWNER);
        accounts.setStatus(accounts.current(inactive, false).id(), Accounts.Status.DEACTIVATED);
        for (var user : List.of(mechanic, inactive)) {
            mvc.perform(get(VEHICLES).with(oidcLogin().oidcUser(user))).andExpect(status().isForbidden());
            mvc.perform(post(VEHICLES).with(oidcLogin().oidcUser(user)).with(csrf())
                    .contentType("application/json").content(REGISTRATION)).andExpect(status().isForbidden());
            mvc.perform(delete(VEHICLES + "/1").with(oidcLogin().oidcUser(user)).with(csrf()))
                    .andExpect(status().isForbidden());
        }
    }

    @Test
    void invalidRegistrationsAndMissingCsrfDoNotCreateVehicles() throws Exception {
        var owner = account("owner", Accounts.Role.OWNER);
        mvc.perform(post(VEHICLES).with(oidcLogin().oidcUser(owner))
                .contentType("application/json").content(REGISTRATION)).andExpect(status().isForbidden());
        for (var invalid : List.of("{}", REGISTRATION.replace("ZG 1234 AB", " "),
                REGISTRATION.replace("Ford", "X".repeat(101)), REGISTRATION.replace("Focus", ""),
                REGISTRATION.replace("2020", "null"), REGISTRATION.replace("2020", "2020.5"),
                REGISTRATION.replace("50000", "-1"), REGISTRATION.replace("50000", "-0.5"))) {
            mvc.perform(post(VEHICLES).with(oidcLogin().oidcUser(owner)).with(csrf())
                    .contentType("application/json").content(invalid)).andExpect(status().isBadRequest());
        }
        mvc.perform(get(VEHICLES).with(oidcLogin().oidcUser(owner)))
                .andExpect(status().isOk()).andExpect(jsonPath("$").isEmpty());
    }

    private OidcUser account(String subject, Accounts.Role role) {
        var identity = new DefaultOidcUser(List.of(), OidcIdToken.withTokenValue("test")
                .issuer("https://identity.example").subject(subject).build());
        accounts.register(accounts.resolve(identity).id(), role, Accounts.Status.ACTIVE, subject, null);
        return identity;
    }
}
