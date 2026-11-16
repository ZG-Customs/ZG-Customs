package hr.fer.zgcustoms.accounts;

import static hr.fer.zgcustoms.accounts.Accounts.Role.*;
import static hr.fer.zgcustoms.accounts.Accounts.Status.*;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
public class OnboardingController {
    public enum PublicRole { OWNER, MECHANIC, MANAGER }
    public enum Decision { ACCEPTED, REJECTED }

    public record Registration(@NotNull PublicRole role,
            @NotBlank @Size(max = 300) String contact,
            @Size(max = 500) String specializations) {}

    public record WorkshopRequest(@NotBlank @Size(max = 150) String name,
            @NotBlank @Size(max = 300) String contactDetails,
            @NotBlank @Size(max = 2000) String ownershipEvidence) {}

    public record Profile(long id, Accounts.Role role, Accounts.Status status, String name,
            String contactEmail, String contactDetails, String specializations, Long workshopId) {}
    public record ProfilePatch(@Size(min = 1, max = 150) String name,
            @Email @Size(max = 254) String contactEmail, @Size(max = 300) String contactDetails,
            @Size(max = 500) String specializations) {}
    public record Review(@NotNull Decision decision) {}
    public record WorkshopOption(long id, String name) {}
    public record RequestView(long id, String name, String status) {}
    public record MembershipView(long id, long mechanicId, String name, String status, String specializations) {}
    public record ApplicationView(long id, String name, String status, long applicantId,
            String contactDetails, String ownershipEvidence) {}
    public record Provider(boolean enabled) {}

    private final Accounts accounts;
    private final JdbcClient db;
    private final ObjectProvider<ClientRegistrationRepository> registrations;

    public OnboardingController(Accounts accounts, JdbcClient db,
            ObjectProvider<ClientRegistrationRepository> registrations) {
        this.accounts = accounts;
        this.db = db;
        this.registrations = registrations;
    }

    @GetMapping("/auth/provider")
    Provider provider() {
        var repository = registrations.getIfAvailable();
        return new Provider(repository != null && repository.findByRegistrationId("external") != null);
    }

    @GetMapping("/auth/csrf")
    CsrfToken csrf(CsrfToken token) {
        return token;
    }

    @GetMapping("/me")
    Profile me(@AuthenticationPrincipal OidcUser identity) {
        var account = availableAccount(identity);
        return db.sql("""
                SELECT u.id, u.status, u.name, u.email AS contact_email, u.contact_details,
                       u.specializations, w.id AS workshop_id,
                       CASE r.code WHEN 'CLIENT' THEN 'OWNER' WHEN 'WORKSHOP_MANAGER' THEN 'MANAGER'
                           ELSE r.code END AS role
                FROM users u LEFT JOIN workshops w ON w.manager_id = u.id AND w.status = 'ACTIVE'
                LEFT JOIN user_roles ur ON ur.user_id = u.id LEFT JOIN roles r ON r.id = ur.role_id
                WHERE u.id = ? AND u.status <> 'DEACTIVATED'
                """).param(account.id()).query(Profile.class).optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN));
    }

    @PatchMapping("/me")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void updateProfile(@AuthenticationPrincipal OidcUser identity,
            @Valid @RequestBody ProfilePatch input) {
        var account = accounts.current(identity, true);
        require(account.status() == ACTIVE, HttpStatus.FORBIDDEN);
        require(input.specializations() == null || account.role() == MECHANIC, HttpStatus.BAD_REQUEST);
        require(input.name() == null || !input.name().isBlank(), HttpStatus.BAD_REQUEST);
        db.sql("""
                UPDATE users SET name = COALESCE(?, name),
                    email = COALESCE(?, email),
                    contact_details = COALESCE(?, contact_details),
                    specializations = COALESCE(?, specializations)
                WHERE id = ?
                """).param(input.name()).param(input.contactEmail()).param(input.contactDetails())
                .param(input.specializations()).param(account.id()).update();
    }

    private Accounts.Account availableAccount(OidcUser identity) {
        var account = accounts.current(identity, false);
        require(account.status() != DEACTIVATED, HttpStatus.FORBIDDEN);
        return account;
    }

    @PostMapping("/auth/register")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void register(@AuthenticationPrincipal OidcUser identity, @Valid @RequestBody Registration input) {
        var account = accounts.current(identity, true);
        require(account.status() == UNREGISTERED, HttpStatus.FORBIDDEN);
        var role = Accounts.Role.valueOf(input.role().name());
        accounts.register(account.id(), role, role == OWNER ? ACTIVE : PENDING,
                input.contact().strip(), role == MECHANIC ? input.specializations() : null);
    }

    @GetMapping("/workshops")
    List<WorkshopOption> workshops(@AuthenticationPrincipal OidcUser identity) {
        var account = availableAccount(identity);
        require(account.status() == ACTIVE || (account.status() == PENDING && account.role() == MECHANIC),
                HttpStatus.FORBIDDEN);
        return db.sql("SELECT id, name FROM workshops WHERE status = 'ACTIVE' ORDER BY name, id")
                .query(WorkshopOption.class).list();
    }

    @PostMapping("/workshops/{id}/membership-requests")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void requestMembership(@AuthenticationPrincipal OidcUser identity,
            @PathVariable long id) {
        var account = accounts.current(identity, true);
        requirePending(account, MECHANIC);
        int inserted = db.sql("""
                INSERT INTO membership_requests (user_id, workshop_id)
                SELECT ?, id FROM workshops WHERE id = ? AND status = 'ACTIVE'
                ON CONFLICT DO NOTHING
                """).params(account.id(), id).update();
        require(inserted == 1, HttpStatus.CONFLICT);
    }

    @PostMapping("/workshop-applications")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void apply(@AuthenticationPrincipal OidcUser identity, @Valid @RequestBody WorkshopRequest input) {
        var account = accounts.current(identity, true);
        requirePending(account, MANAGER);
        int inserted = db.sql("""
                INSERT INTO workshop_applications (applicant_id, name, contact_details, ownership_evidence)
                VALUES (?, ?, ?, ?) ON CONFLICT DO NOTHING
                """).params(account.id(), input.name().strip(), input.contactDetails().strip(),
                input.ownershipEvidence().strip()).update();
        require(inserted == 1, HttpStatus.CONFLICT);
    }

    @GetMapping("/onboarding/mine")
    List<RequestView> mine(@AuthenticationPrincipal OidcUser identity) {
        var account = availableAccount(identity);
        if (account.role() == MANAGER) {
            return db.sql("""
                    SELECT id, name, status FROM workshop_applications
                    WHERE applicant_id = ? ORDER BY id DESC
                    """).param(account.id()).query(RequestView.class).list();
        }
        require(account.role() == MECHANIC, HttpStatus.FORBIDDEN);
        return db.sql("""
                SELECT m.id, w.name, m.status FROM membership_requests m JOIN workshops w ON w.id = m.workshop_id
                WHERE m.user_id = ? ORDER BY m.id DESC
                """).param(account.id()).query(RequestView.class).list();
    }

    @GetMapping("/admin/workshop-applications")
    List<ApplicationView> applications(@AuthenticationPrincipal OidcUser identity) {
        accounts.current(identity, false).requireActive(ADMIN);
        return db.sql("""
                SELECT id, name, status, applicant_id, contact_details, ownership_evidence
                FROM workshop_applications ORDER BY id
                """).query(ApplicationView.class).list();
    }

    @GetMapping("/workshops/{id}/membership-requests")
    List<MembershipView> membershipRequests(@AuthenticationPrincipal OidcUser identity, @PathVariable long id) {
        return memberships(identity, id, "PENDING");
    }

    @GetMapping("/workshops/{id}/mechanics")
    List<MembershipView> mechanics(@AuthenticationPrincipal OidcUser identity, @PathVariable long id) {
        return memberships(identity, id, "ACCEPTED");
    }

    private List<MembershipView> memberships(OidcUser identity, long id, String status) {
        var account = accounts.current(identity, false);
        account.requireActive(MANAGER);
        require(db.sql("SELECT EXISTS (SELECT 1 FROM workshops WHERE id = ? AND manager_id = ? AND status = 'ACTIVE')")
                .params(id, account.id()).query(Boolean.class).single(), HttpStatus.FORBIDDEN);
        return db.sql("""
                SELECT m.id, m.user_id AS mechanic_id, COALESCE(u.name, u.contact_details) AS name,
                       m.status, u.specializations
                FROM membership_requests m
                JOIN workshops w ON w.id = m.workshop_id JOIN users u ON u.id = m.user_id
                WHERE w.id = ? AND w.manager_id = ? AND w.status = 'ACTIVE'
                  AND m.status = ? ORDER BY m.id
                """).params(id, account.id(), status).query(MembershipView.class).list();
    }

    @PostMapping("/admin/workshop-applications/{id}/decision")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void decideApplication(@AuthenticationPrincipal OidcUser identity, @PathVariable long id,
            @Valid @RequestBody Review input) {
        accounts.current(identity, true).requireActive(ADMIN);
        long applicant = db.sql("""
                SELECT u.id FROM users u JOIN workshop_applications a ON a.applicant_id = u.id
                WHERE a.id = ? AND EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id
                      WHERE ur.user_id = u.id AND r.code = 'WORKSHOP_MANAGER') AND u.status = 'PENDING' FOR UPDATE OF u
                """).param(id).query(Long.class).optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT));
        require(db.sql("""
                UPDATE workshop_applications SET status = ?, decided_at = now()
                WHERE id = ? AND status = 'PENDING'
                """).params(input.decision().name(), id).update() == 1, HttpStatus.CONFLICT);
        if (input.decision() == Decision.ACCEPTED) {
            db.sql("""
                    INSERT INTO workshops (manager_id, application_id, name, contact_details)
                    SELECT applicant_id, id, name, contact_details FROM workshop_applications WHERE id = ?
                    """).param(id).update();
            accounts.setStatus(applicant, ACTIVE);
        }
    }

    @PostMapping("/membership-requests/{id}/decision")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void decideMembership(@AuthenticationPrincipal OidcUser identity, @PathVariable long id,
            @Valid @RequestBody Review input) {
        updateMembership(identity, id, null, "PENDING", input.decision().name(),
                input.decision() == Decision.ACCEPTED ? ACTIVE : PENDING);
    }

    @DeleteMapping("/workshops/{id}/memberships/{membershipId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void removeMembership(@AuthenticationPrincipal OidcUser identity, @PathVariable long id,
            @PathVariable long membershipId) {
        updateMembership(identity, membershipId, id, "ACCEPTED", "REMOVED", PENDING);
    }

    private void updateMembership(OidcUser identity, long id, Long workshopId, String from, String to,
            Accounts.Status newStatus) {
        var manager = accounts.current(identity, true);
        manager.requireActive(MANAGER);
        long mechanic = db.sql("""
                SELECT u.id FROM users u JOIN membership_requests m ON m.user_id = u.id
                JOIN workshops w ON w.id = m.workshop_id
                WHERE m.id = ? AND w.manager_id = ? AND w.status = 'ACTIVE'
                  AND w.id = COALESCE(CAST(? AS bigint), w.id)
                  AND EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id
                      WHERE ur.user_id = u.id AND r.code = 'MECHANIC') AND u.status <> 'DEACTIVATED'
                FOR UPDATE OF u, w
                """).param(id).param(manager.id()).param(workshopId)
                .query(Long.class).optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN));
        require(db.sql("""
                UPDATE membership_requests SET status = ?, ended_at = CASE WHEN ? = 'ACCEPTED' THEN NULL ELSE now() END
                WHERE id = ? AND status = ?
                """).params(to, to, id, from).update() == 1, HttpStatus.CONFLICT);
        if ("ACCEPTED".equals(to)) {
            db.sql("""
                    INSERT INTO workshop_memberships (user_id, workshop_id)
                    SELECT user_id, workshop_id FROM membership_requests WHERE id = ?
                    """).param(id).update();
        } else if ("REMOVED".equals(to)) {
            db.sql("DELETE FROM workshop_memberships WHERE user_id = ? AND workshop_id = ?")
                    .params(mechanic, workshopId).update();
        }
        accounts.setStatus(mechanic, newStatus);
    }

    private static void requirePending(Accounts.Account account, Accounts.Role role) {
        require(account.role() == role && account.status() == PENDING, HttpStatus.FORBIDDEN);
    }

    private static void require(boolean condition, HttpStatus status) {
        if (!condition) {
            throw new ResponseStatusException(status);
        }
    }
}
