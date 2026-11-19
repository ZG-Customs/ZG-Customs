package hr.fer.zgcustoms.accounts;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Repository;
import org.springframework.web.server.ResponseStatusException;

@Repository
public class Accounts {
    public enum Role { OWNER, MECHANIC, MANAGER, ADMIN }
    public enum Status { UNREGISTERED, PENDING, ACTIVE, DEACTIVATED }

    public record Account(long id, Role role, Status status) {
        public void requireActive(Role requiredRole) {
            if (status != Status.ACTIVE || role != requiredRole) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN);
            }
        }
    }

    private final JdbcClient db;

    public Accounts(JdbcClient db) {
        this.db = db;
    }

    public Account resolve(OidcUser identity) {
        String name = identity.getFullName();
        String email = identity.getEmail();
        db.sql("""
                INSERT INTO users (oidc_issuer, oidc_subject, name, email) VALUES (?, ?, ?, ?)
                ON CONFLICT (oidc_issuer, oidc_subject) DO NOTHING
                """).params(identity.getIssuer().toExternalForm(), identity.getSubject(),
                        name == null || name.isBlank() ? "Korisnik" : name.substring(0, Math.min(150, name.length())),
                        email == null ? "" : email).update();
        return current(identity, false);
    }

    public Account current(OidcUser identity, boolean lock) {
        if (identity == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        String sql = """
                SELECT u.id, u.status, CASE r.code
                    WHEN 'CLIENT' THEN 'OWNER'
                    WHEN 'WORKSHOP_MANAGER' THEN 'MANAGER'
                    ELSE r.code END AS role
                FROM users u LEFT JOIN user_roles ur ON ur.user_id = u.id
                LEFT JOIN roles r ON r.id = ur.role_id
                WHERE u.oidc_issuer = ? AND u.oidc_subject = ?
                """;
        return db.sql(lock ? sql + " FOR UPDATE OF u" : sql)
                .params(identity.getIssuer().toExternalForm(), identity.getSubject())
                .query(Account.class).optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN));
    }

    public void register(long id, Role role, Status status, String contact, String specializations) {
        String code = switch (role) {
            case OWNER -> "CLIENT";
            case MANAGER -> "WORKSHOP_MANAGER";
            default -> role.name();
        };
        db.sql("INSERT INTO user_roles (user_id, role_id) SELECT ?, id FROM roles WHERE code = ?")
                .params(id, code).update();
        db.sql("""
                UPDATE users SET status = ?, contact_details = ?, specializations = ? WHERE id = ?
                """).param(status.name()).param(contact).param(specializations).param(id).update();
    }

    public void setStatus(long id, Status status) {
        db.sql("UPDATE users SET status = ? WHERE id = ?")
                .params(status.name(), id).update();
    }
}
