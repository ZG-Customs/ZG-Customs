import { useRef, useState } from "react";
import { logout } from "../../auth/WorkshopAccount";
import VehiclesSection from "./vehicles/VehiclesSection";

export default function OwnerDashboard() {
    const [signingOut, setSigningOut] = useState(false);
    const [logoutError, setLogoutError] = useState("");
    const logoutPending = useRef(false);

    async function handleLogout() {
        if (logoutPending.current) return;
        logoutPending.current = true;
        setSigningOut(true);
        setLogoutError("");
        try {
            await logout();
            window.location.replace("/login/user");
        } catch {
            setLogoutError("Odjava nije uspjela. Pokušajte ponovno.");
            logoutPending.current = false;
            setSigningOut(false);
        }
    }

    return (
        <div className="owner-dashboard">
            <header className="site-header dashboard-header">
                <a
                    className="brand"
                    href="/"
                    aria-label="ZG Customs — početna stranica">
                    <span className="brand-mark">ZG</span>
                    <span className="brand-name">CUSTOMS</span>
                </a>
                <nav
                    className="dashboard-nav"
                    aria-label="Korisnička navigacija">
                    <a
                        href="#overview"
                        aria-current="page">
                        Pregled
                    </a>
                    <a href="#vehicles">Moja vozila</a>
                    <a href="#services">Moji servisi</a>
                </nav>
                <details className="dashboard-profile">
                    <summary>
                        Moj račun <span aria-hidden="true">⌄</span>
                    </summary>
                    <div className="dashboard-profile-menu">
                        <button type="button">Osobni podaci</button>
                        <button type="button" disabled={signingOut} onClick={() => void handleLogout()}>
                            {signingOut ? "Odjava…" : "Odjava"}
                        </button>
                        {logoutError && <p role="alert">{logoutError}</p>}
                        <button
                            type="button"
                            className="dashboard-danger">
                            Izbriši račun
                        </button>
                    </div>
                </details>
            </header>

            <main
                className="page-content dashboard-content"
                id="overview">
                <section
                    className="dashboard-welcome"
                    aria-labelledby="dashboard-title">
                    <div>
                        <p className="eyebrow">
                            MOJA GARAŽA <span>/</span> PREGLED
                        </p>
                        <h1 id="dashboard-title">Sve za vaše vozilo.</h1>
                        <p>Termini, radovi i sljedeći koraci — na jednom mjestu.</p>
                    </div>
                    <button
                        type="button"
                        className="primary-button">
                        Rezerviraj servis <span aria-hidden="true">＋</span>
                    </button>
                </section>

                <section
                    className="dashboard-action"
                    aria-labelledby="action-title">
                    <div>
                        <p className="eyebrow">POTREBNA JE VAŠA POTVRDA</p>
                        <h2 id="action-title">Zamjena prednjih kočionih pločica</h2>
                        <p>Volkswagen Golf · ZG 1234 AB</p>
                        <p>Serviser predlaže zamjenu istrošenih pločica uz redovni servis.</p>
                        <p className="dashboard-estimate">
                            Procijenjeni dodatni trošak <strong>85,00 €</strong>
                        </p>
                    </div>
                    <div className="dashboard-actions">
                        <button
                            type="button"
                            className="dashboard-button dashboard-button-accent">
                            Prihvati radove
                        </button>
                        <button
                            type="button"
                            className="dashboard-button">
                            Odbij
                        </button>
                    </div>
                </section>

                <div className="dashboard-columns">
                    <section
                        id="services"
                        aria-labelledby="services-title">
                        <div className="dashboard-section-heading">
                            <h2 id="services-title">Aktualni servisi</h2>
                        </div>
                        <div className="dashboard-service-list">
                            <article className="dashboard-card">
                                <div className="dashboard-card-heading">
                                    <p className="eyebrow">VOLKSWAGEN GOLF · ZG 1234 AB</p>
                                    <span className="dashboard-status dashboard-status-active">
                                        U tijeku
                                    </span>
                                </div>
                                <h3>Redovni servis</h3>
                                <p>20. studenoga 2026. · 09:00</p>
                                <div className="dashboard-note">
                                    <span>POSLJEDNJA NAPOMENA SERVISERA</span>
                                    <p>
                                        Ulje i filtri su zamijenjeni. Čekamo vašu potvrdu dodatnih
                                        radova.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="dashboard-text-button">
                                    Detalji servisa <span aria-hidden="true">↗</span>
                                </button>
                            </article>
                            <article className="dashboard-card">
                                <div className="dashboard-card-heading">
                                    <p className="eyebrow">RENAULT CLIO · ZG 5678 CD</p>
                                    <span className="dashboard-status">Potvrđeno</span>
                                </div>
                                <h3>Zamjena guma</h3>
                                <p>25. studenoga 2026. · 10:30</p>
                                <div className="dashboard-card-footer">
                                    <button
                                        type="button"
                                        className="dashboard-text-button">
                                        Detalji servisa <span aria-hidden="true">↗</span>
                                    </button>
                                    <button
                                        type="button"
                                        className="dashboard-text-button">
                                        Dodaj u kalendar <span aria-hidden="true">＋</span>
                                    </button>
                                </div>
                            </article>
                        </div>
                    </section>

                    <VehiclesSection />
                </div>

                <section
                    className="dashboard-history"
                    aria-labelledby="history-title">
                    <div className="dashboard-section-heading">
                        <h2 id="history-title">Nedavno završeno</h2>
                        <button
                            type="button"
                            className="dashboard-text-button">
                            Povijest servisa ↗
                        </button>
                    </div>
                    <article className="dashboard-card dashboard-completed">
                        <div>
                            <p className="eyebrow">RENAULT CLIO · ZG 5678 CD</p>
                            <h3>Zamjena akumulatora</h3>
                            <p>
                                5. studenoga 2026. <span aria-hidden="true">·</span>{" "}
                                <strong>145,00 €</strong>
                            </p>
                        </div>
                        <div className="dashboard-completed-actions">
                            <button
                                type="button"
                                className="dashboard-text-button">
                                Detalji servisa ↗
                            </button>
                            <button
                                type="button"
                                className="dashboard-text-button">
                                Preuzmi račun ↓
                            </button>
                            <button
                                type="button"
                                className="dashboard-button">
                                Ocijeni servis <span aria-hidden="true">☆</span>
                            </button>
                        </div>
                    </article>
                </section>
            </main>
            <footer
                className="checkerboard"
                aria-hidden="true"
            />
        </div>
    );
}
