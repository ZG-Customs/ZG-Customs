import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { getWorkshopLogin, LOGIN_INTENT, workshopPages } from "./auth/WorkshopAccount";
import OwnerDashboard from "./dashboard/owner/OwnerDashboard";
import ManagerLandingPage from "./landing-pages/ManagerLandingPage";
import MechanicLandingPage from "./landing-pages/MechanicLandingPage";
import OwnerLandingPage from "./landing-pages/OwnerLandingPage";
import "./style.css";

type ServiceType = {
    id: number;
    code: string;
    name: string;
    description: string;
};

function resumeWorkshopLogin() {
    if (window.location.pathname !== "/") return false;
    const intent = getWorkshopLogin();
    if (!intent || intent.stage !== "sign-in") return false;

    try {
        const path = workshopPages[intent.role];
        const failed = new URLSearchParams(window.location.search).get("login") === "failed";
        if (failed) {
            sessionStorage.removeItem(LOGIN_INTENT);
        } else {
            sessionStorage.setItem(
                LOGIN_INTENT,
                JSON.stringify({ ...intent, stage: "registration" }),
            );
        }
        window.location.replace(path + (failed ? "?login=failed" : ""));
        return true;
    } catch {
        return false;
    }
}

function App() {
    const path = window.location.pathname.replace(/\/+$/, "") || "/";
    if (path === "/dashboard/owner") {
        return <OwnerDashboard />;
    }
    if (path === "/about") {
        return <div className="blank-page" />;
    }

    return (
        <div className="site-shell">
            <header className="site-header">
                <a
                    className="brand"
                    href="/"
                    aria-label="ZG Customs — početna stranica">
                    <span className="brand-mark">ZG</span>
                    <span className="brand-name">CUSTOMS</span>
                </a>

                <nav
                    className="site-nav"
                    aria-label="Glavna navigacija">
                    <a href="/about">O nama</a>
                    <a href="/login/mechanic">Mehaničari</a>
                    <a href="/login/manager">Vlasnici autoservisa</a>
                </nav>
            </header>

            <main className="page-content">
                {path === workshopPages.MECHANIC ? (
                    <MechanicLandingPage />
                ) : path === workshopPages.MANAGER ? (
                    <ManagerLandingPage />
                ) : path === workshopPages.OWNER ? (
                    <OwnerLandingPage />
                ) : (
                    <LandingPage />
                )}
            </main>

            <footer
                className="checkerboard"
                aria-hidden="true"
            />
        </div>
    );
}

function LandingPage() {
    const [services, setServices] = useState<ServiceType[]>([]);
    const [state, setState] = useState<"loading" | "ready" | "error">("loading");

    useEffect(() => {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 10_000);
        let active = true;

        async function loadServices() {
            try {
                const response = await fetch("/api/service-types", {
                    signal: controller.signal,
                });
                if (!response.ok) {
                    throw new Error("Service catalog unavailable");
                }

                const data: unknown = await response.json();
                if (
                    !Array.isArray(data) ||
                    !data.every(
                        (item) =>
                            typeof item?.id === "number" &&
                            typeof item?.code === "string" &&
                            typeof item?.name === "string" &&
                            typeof item?.description === "string",
                    )
                ) {
                    throw new Error("Invalid service catalog");
                }

                if (active) {
                    setServices(data);
                    setState("ready");
                }
            } catch {
                if (active) {
                    setState("error");
                }
            } finally {
                window.clearTimeout(timeout);
            }
        }

        void loadServices();

        return () => {
            active = false;
            window.clearTimeout(timeout);
            controller.abort();
        };
    }, []);

    return (
        <>
            <section
                className="hero"
                aria-labelledby="hero-title">
                <div className="hero-copy">
                    <h1 id="hero-title">ZG Customs</h1>
                    <p className="hero-description">
                        Dogovorite servis, pratite radove i čuvajte povijest radova svog vozila.
                    </p>
                    <a
                        className="primary-button"
                        href="/login/user">
                        Prijava za vlasnike vozila <span aria-hidden="true">↗</span>
                    </a>
                </div>
            </section>

            <details className="catalog">
                <summary>
                    Vrste servisa <span aria-hidden="true">＋</span>
                </summary>
                <div
                    role="status"
                    aria-live="polite">
                    {state === "loading" && <p>Učitavanje podataka…</p>}
                    {state === "error" && (
                        <p>Podatke trenutačno nije moguće učitati. Pokušajte osvježiti stranicu.</p>
                    )}
                </div>

                {state === "ready" &&
                    (services.length > 0 ? (
                        <ul>
                            {services.map((service) => (
                                <li key={service.id}>
                                    <strong>{service.name}</strong> — {service.description}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>Još nema dodanih vrsta servisa.</p>
                    ))}
            </details>
        </>
    );
}

if (!resumeWorkshopLogin()) {
    createRoot(document.getElementById("root")!).render(
        <StrictMode>
            <App />
        </StrictMode>,
    );
}
