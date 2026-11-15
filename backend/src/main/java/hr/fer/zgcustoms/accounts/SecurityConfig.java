package hr.fer.zgcustoms.accounts;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
class SecurityConfig {
    @Bean
    SecurityFilterChain security(HttpSecurity http, Accounts accounts,
            ObjectProvider<ClientRegistrationRepository> registrations) throws Exception {
        http.authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/service-types", "/actuator/health/**", "/error").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/auth/login/**", "/api/auth/callback/**",
                        "/api/auth/csrf", "/api/auth/provider").permitAll()
                .requestMatchers("/api/auth/**", "/api/onboarding/mine", "/api/me",
                        "/api/workshop-applications", "/api/workshops", "/api/workshops/*/membership-requests",
                        "/api/workshops/*/mechanics", "/api/workshops/*/memberships/*",
                        "/api/membership-requests/*/decision", "/api/admin/workshop-applications",
                        "/api/admin/workshop-applications/*/decision").authenticated()
                .anyRequest().denyAll())
            .csrf(csrf -> csrf.ignoringRequestMatchers("/api/service-types"))
            .exceptionHandling(errors -> errors.authenticationEntryPoint(
                    (request, response, exception) -> response.sendError(401)))
            .requestCache(cache -> cache.disable())
            .logout(logout -> logout.logoutUrl("/api/auth/logout")
                    .logoutSuccessHandler((request, response, authentication) -> response.setStatus(204)));

        if (registrations.getIfAvailable() != null) {
            var delegate = new OidcUserService();
            http.oauth2Login(login -> login
                    .authorizationEndpoint(endpoint -> endpoint.baseUri("/api/auth/login"))
                    .redirectionEndpoint(endpoint -> endpoint.baseUri("/api/auth/callback/*"))
                    .userInfoEndpoint(info -> info.oidcUserService(request -> {
                        var identity = delegate.loadUser(request);
                        try {
                            if (accounts.resolve(identity).status() == Accounts.Status.DEACTIVATED) {
                                throw new DisabledException("Account disabled");
                            }
                            return identity;
                        } catch (RuntimeException ex) {
                            throw new OAuth2AuthenticationException(new OAuth2Error("account_unavailable"), ex);
                        }
                    }))
                    .defaultSuccessUrl("/", true)
                    .failureHandler((request, response, exception) -> {
                        var session = request.getSession(false);
                        if (session != null) {
                            session.invalidate();
                        }
                        response.sendRedirect("/?login=failed");
                    }));
        }
        return http.build();
    }
}
