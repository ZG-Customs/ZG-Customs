import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

type ServiceType = {
  id: number;
  code: string;
  name: string;
  description: string;
};

const blankPagePaths = new Set([
  "/about",
  "/login/user",
  "/login/mechanic",
  "/login/manager",
]);

function App() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  return blankPagePaths.has(path) ? (
    <div className="blank-page" />
  ) : (
    <LandingPage />
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
    <div className="site-shell">
      <header className="site-header">
        <a
          className="brand"
          href="/"
          aria-label="ZG Customs — početna stranica"
        >
          <span className="brand-mark">ZG</span>
          <span className="brand-name">CUSTOMS</span>
        </a>

        <nav className="site-nav" aria-label="Glavna navigacija">
          <a href="/about">O nama</a>
          <a href="/login/mechanic">Prijava za mehaničare</a>
          <a href="/login/manager">Prijava za menadžere</a>
        </nav>
      </header>

      <main className="page-content">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">ZG CUSTOMS</p>
            <h1 id="hero-title">ZG Customs</h1>
            <p className="hero-description">
              Dogovorite servis, pratite radove i čuvajte povijest radova svog
              vozila.
            </p>
            <a className="primary-button" href="/login/user">
              Prijava za korisnike <span aria-hidden="true">↗</span>
            </a>
          </div>
        </section>

        <details className="catalog">
          <summary>
            Vrste servisa <span aria-hidden="true">＋</span>
          </summary>
          <div role="status" aria-live="polite">
            {state === "loading" && <p>Učitavanje podataka…</p>}
            {state === "error" && (
              <p>
                Podatke trenutačno nije moguće učitati. Pokušajte osvježiti
                stranicu.
              </p>
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
      </main>

      <footer className="checkerboard" aria-hidden="true" />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
