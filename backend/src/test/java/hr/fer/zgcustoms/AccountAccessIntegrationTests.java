package hr.fer.zgcustoms;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oidcLogin;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.List;

import hr.fer.zgcustoms.accounts.Accounts;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.util.UriComponentsBuilder;

@SpringBootTest
@Transactional
@TestPropertySource(properties = {
    "spring.datasource.url=${TEST_DATABASE_URL:jdbc:postgresql://localhost:55432/zg_customs_test}",
    "spring.datasource.username=${TEST_DATABASE_USER:zg_customs_test}",
    "spring.datasource.password=${TEST_DATABASE_PASSWORD:test-only-password}"
})
class AccountAccessIntegrationTests {
    @Autowired WebApplicationContext context;
    @Autowired Accounts accounts;
    @Autowired JdbcClient db;
    MockMvc mvc;

    @TestConfiguration
    static class OidcTestConfiguration {
        @Bean
        InMemoryClientRegistrationRepository clientRegistrations() {
            return new InMemoryClientRegistrationRepository(ClientRegistration.withRegistrationId("external")
                    .clientId("test").clientSecret("test")
                    .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                    .scope("openid")
                    .redirectUri("http://localhost/api/auth/callback/external")
                    .authorizationUri("https://identity.example/authorize")
                    .tokenUri("https://identity.example/token")
                    .jwkSetUri("https://identity.example/jwks")
                    .build());
        }
    }

    @BeforeEach
    void configureMvc() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    @Test
    void repeatIdentityUsesSameAccountAndIssuerSeparatesIdentities() throws Exception {
        var identity = identity("owner");
        long id = accounts.resolve(identity).id();
        assertThat(accounts.resolve(identity).id()).isEqualTo(id);
        assertThat(accounts.resolve(identity("https://another.example", "owner")).id()).isNotEqualTo(id);
        mvc.perform(get("/api/me")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/me").with(oidcLogin().oidcUser(identity)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.id").value(id));
    }

    @Test
    void deniedCallbackDoesNotEstablishSession() throws Exception {
        var login = mvc.perform(get("/api/auth/login/external"))
                .andExpect(status().isFound()).andReturn();
        var session = (MockHttpSession) login.getRequest().getSession(false);
        var redirect = UriComponentsBuilder
                .fromUriString(login.getResponse().getRedirectedUrl()).build();
        String state = redirect.getQueryParams().getFirst("state");
        assertThat(redirect.getQueryParams().getFirst("prompt")).isEqualTo("select_account");
        mvc.perform(get("/api/auth/callback/external").session(session)
                .param("error", "access_denied").param("state", state))
                .andExpect(redirectedUrl("/?login=failed"));
        assertThat(session.isInvalid()).isTrue();
        mvc.perform(get("/api/me")).andExpect(status().isUnauthorized());
    }

    @Test
    void logoutInvalidatesTheLocalSession() throws Exception {
        var user = identity("logout");
        accounts.resolve(user);
        var session = new MockHttpSession();
        mvc.perform(get("/api/me").session(session).with(oidcLogin().oidcUser(user)))
                .andExpect(status().isOk());

        mvc.perform(post("/api/auth/logout").session(session).with(oidcLogin().oidcUser(user)).with(csrf()))
                .andExpect(status().isNoContent())
                .andExpect(cookie().maxAge("JSESSIONID", 0));
        assertThat(session.isInvalid()).isTrue();
        mvc.perform(get("/api/me")).andExpect(status().isUnauthorized());
    }

    @Test
    void registrationRequiresCsrfAndCannotAssignAdmin() throws Exception {
        var owner = identity("owner");
        long id = accounts.resolve(owner).id();
        mvc.perform(post("/api/auth/register").with(oidcLogin().oidcUser(owner))
                .contentType("application/json").content("{\"role\":\"OWNER\",\"contact\":\"Owner\"}"))
                .andExpect(status().isForbidden());
        send(owner, "/api/auth/register", "{\"role\":\"ADMIN\",\"contact\":\"Owner\"}", 400);
        var csrfResponse = mvc.perform(get("/api/auth/csrf").with(oidcLogin().oidcUser(owner)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.token").isNotEmpty()).andReturn();
        var token = (CsrfToken) csrfResponse.getRequest().getAttribute(CsrfToken.class.getName());
        mvc.perform(post("/api/auth/register").with(oidcLogin().oidcUser(owner))
                .session((MockHttpSession) csrfResponse.getRequest().getSession(false))
                .header(token.getHeaderName(), token.getToken()).contentType("application/json")
                .content("{\"role\":\"OWNER\",\"contact\":\"Owner\"}"))
                .andExpect(status().isNoContent());
        send(owner, "/api/auth/register", "{\"role\":\"MANAGER\",\"contact\":\"Owner\"}", 403);
        mvc.perform(patch("/api/me").with(oidcLogin().oidcUser(owner)).with(csrf())
                .contentType("application/json").content("{\"name\":\"Test Owner\",\"contactEmail\":\"owner@example.com\"}"))
                .andExpect(status().isNoContent());
        mvc.perform(patch("/api/me").with(oidcLogin().oidcUser(owner)).with(csrf())
                .contentType("application/json").content("{\"specializations\":\"Brakes\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/me").with(oidcLogin().oidcUser(owner)))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.name").value("Test Owner"))
                .andExpect(jsonPath("$.contactEmail").value("owner@example.com"))
                .andExpect(jsonPath("$.contactDetails").value("Owner"));
        accounts.setStatus(id, Accounts.Status.DEACTIVATED);
        mvc.perform(get("/api/me").with(oidcLogin().oidcUser(owner))).andExpect(status().isForbidden());
    }

    @Test
    void workshopAndMembershipRequireScopedApproval() throws Exception {
        var admin = identity("admin");
        accounts.register(accounts.resolve(admin).id(), Accounts.Role.ADMIN, Accounts.Status.ACTIVE, "Admin", null);
        var manager = identity("manager");
        var other = identity("other-manager");
        var mechanic = identity("mechanic");
        long workshop = createWorkshop(manager, admin, "Own workshop");
        long otherWorkshop = createWorkshop(other, admin, "Other workshop");
        String workshopPath = "/api/workshops/" + workshop;

        accounts.resolve(mechanic);
        send(mechanic, "/api/auth/register",
                "{\"role\":\"MECHANIC\",\"contact\":\"Mechanic\",\"specializations\":\"Brakes\"}", 204);
        mvc.perform(get("/api/workshops").with(oidcLogin().oidcUser(mechanic)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(2));
        mvc.perform(post(workshopPath + "/membership-requests").with(oidcLogin().oidcUser(mechanic)).with(csrf()))
                .andExpect(status().isNoContent());
        long membership = db.sql("SELECT id FROM membership_requests WHERE workshop_id = ?")
                .param(workshop).query(Long.class).single();
        String path = "/api/membership-requests/" + membership;
        String accept = "{\"decision\":\"ACCEPTED\"}";

        mvc.perform(get("/api/me").with(oidcLogin().oidcUser(mechanic)))
                .andExpect(jsonPath("$.status").value("PENDING"));
        mvc.perform(get(workshopPath + "/membership-requests").with(oidcLogin().oidcUser(other)))
                .andExpect(status().isForbidden());
        mvc.perform(get(workshopPath + "/membership-requests").with(oidcLogin().oidcUser(manager)))
                .andExpect(jsonPath("$[0].id").value(membership));
        send(other, path + "/decision", accept, 403);
        send(mechanic, path + "/decision", accept, 403);
        send(manager, path + "/decision", accept, 204);
        send(manager, path + "/decision", accept, 409);
        mvc.perform(get("/api/me").with(oidcLogin().oidcUser(mechanic)))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
        mvc.perform(get("/api/onboarding/mine").with(oidcLogin().oidcUser(mechanic)))
                .andExpect(jsonPath("$[0].id").value(membership));

        var stranger = identity("stranger");
        accounts.resolve(stranger);
        send(stranger, "/api/auth/register", "{\"role\":\"MECHANIC\",\"contact\":\"Stranger\"}", 204);
        mvc.perform(get("/api/onboarding/mine").with(oidcLogin().oidcUser(stranger)))
                .andExpect(jsonPath("$.length()").value(0));

        mvc.perform(get(workshopPath + "/mechanics").with(oidcLogin().oidcUser(manager)))
                .andExpect(jsonPath("$[0].id").value(membership))
                .andExpect(jsonPath("$[0].specializations").value("Brakes"));
        mvc.perform(delete("/api/workshops/" + otherWorkshop + "/memberships/" + membership)
                .with(oidcLogin().oidcUser(manager)).with(csrf())).andExpect(status().isForbidden());
        mvc.perform(delete(workshopPath + "/memberships/" + membership)
                .with(oidcLogin().oidcUser(manager)).with(csrf())).andExpect(status().isNoContent());
        mvc.perform(get("/api/me").with(oidcLogin().oidcUser(mechanic)))
                .andExpect(jsonPath("$.status").value("PENDING"));
        accounts.setStatus(accounts.resolve(manager).id(), Accounts.Status.DEACTIVATED);
        mvc.perform(get(workshopPath + "/membership-requests").with(oidcLogin().oidcUser(manager)))
                .andExpect(status().isForbidden());
    }

    private long createWorkshop(OidcUser manager, OidcUser admin, String name) throws Exception {
        long managerId = accounts.resolve(manager).id();
        send(manager, "/api/auth/register", "{\"role\":\"MANAGER\",\"contact\":\"Manager\"}", 204);
        send(manager, "/api/workshop-applications",
                "{\"name\":\"" + name + "\",\"contactDetails\":\"Workshop\",\"ownershipEvidence\":\"Document reference\"}", 204);
        long application = db.sql("SELECT id FROM workshop_applications WHERE applicant_id = ?")
                .param(managerId).query(Long.class).single();
        String path = "/api/admin/workshop-applications/" + application + "/decision";
        mvc.perform(get("/api/admin/workshop-applications").with(oidcLogin().oidcUser(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id").value(org.hamcrest.Matchers.hasItem(Math.toIntExact(application))))
                .andExpect(jsonPath("$[*].ownershipEvidence").value(org.hamcrest.Matchers.hasItem("Document reference")));
        mvc.perform(get("/api/me").with(oidcLogin().oidcUser(manager)))
                .andExpect(jsonPath("$.status").value("PENDING"));
        send(manager, path, "{\"decision\":\"ACCEPTED\"}", 403);
        send(admin, path, "{\"decision\":\"ACCEPTED\"}", 204);
        return db.sql("SELECT id FROM workshops WHERE manager_id = ?")
                .param(managerId).query(Long.class).single();
    }

    private void send(OidcUser user, String path, String body, int expected) throws Exception {
        mvc.perform(post(path).with(oidcLogin().oidcUser(user)).with(csrf())
                .contentType("application/json").content(body)).andExpect(status().is(expected));
    }

    private OidcUser identity(String subject) {
        return identity("https://identity.example", subject);
    }

    private OidcUser identity(String issuer, String subject) {
        return new DefaultOidcUser(List.of(), OidcIdToken.withTokenValue("test")
                .issuer(issuer).subject(subject).build());
    }
}
