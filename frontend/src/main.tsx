import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

type ServiceType = { id: number; code: string; name: string; description: string };

function App() {
  const [services, setServices] = useState<ServiceType[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10_000);
    let active = true;
    async function loadServices() {
      try {
        const response = await fetch('/api/service-types', { signal: controller.signal });
        if (!response.ok) throw new Error('Service catalog unavailable');
        const data: unknown = await response.json();
        if (!Array.isArray(data) || !data.every((item) =>
          typeof item?.id === 'number' && typeof item?.code === 'string' &&
          typeof item?.name === 'string' && typeof item?.description === 'string')) {
          throw new Error('Invalid service catalog');
        }
        if (active) { setServices(data); setState('ready'); }
      } catch {
        if (active) setState('error');
      } finally {
        window.clearTimeout(timeout);
      }
    }
    void loadServices();
    return () => { active = false; window.clearTimeout(timeout); controller.abort(); };
  }, []);

  return (
    <>
      <a className="skip-link" href="#main">Preskoči na sadržaj</a>
      <header className="header wrap">
        <a className="wordmark" href="/" aria-label="ZG Customs — početna">ZG<span className="brand-square" aria-hidden="true" />CUSTOMS</a>
        <span className="badge"><span aria-hidden="true" />Aplikacija u razvoju</span>
      </header>
      <main id="main" className="wrap">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">MANJE BRIGE. VIŠE VOŽNJE.</p>
            <h1 id="hero-title">Vaš servis,<br /><span>jednostavnije.</span></h1>
            <p className="intro">Od prvog termina do posljednjeg detalja. Gradimo jedno mjesto za vaše vozilo, servis i sve između.</p>
            <a className="button" href="#usluge">Pogledajte vrste servisa <span aria-hidden="true">↗</span></a>
            <p className="preview-note">Početna demonstracijska verzija. Naručivanje još nije dostupno.</p>
          </div>
          <div className="car-panel" aria-hidden="true">
            <div className="panel-top"><span>ZG / 01</span><span>VAŠE VOZILO. VAŠ MIR.</span></div>
            <svg viewBox="0 0 620 350" fill="none" className="car">
              <path d="M55 260H565M82 291H537M120 321H500" stroke="#484b44" strokeWidth="1" />
              <circle cx="310" cy="164" r="133" stroke="#484b44" strokeWidth="1" />
              <path d="M100 222L114 175L168 160L225 107H390L446 164L507 180L524 222V244H485M394 244H228M137 244H100V222Z" stroke="#f2f2e8" strokeWidth="4" strokeLinejoin="round" />
              <path d="M183 163L233 120H300V163H183ZM315 120H382L423 163H315V120Z" stroke="#f2f2e8" strokeWidth="3" strokeLinejoin="round" />
              <path d="M119 182H156L143 199H111M492 186H507L517 205H492V186Z" fill="#d5fc65" />
              <path d="M314 176V222M174 176H456M265 177H283M371 177H389" stroke="#f2f2e8" strokeWidth="3" />
              <circle cx="183" cy="237" r="43" fill="#252a25" stroke="#f2f2e8" strokeWidth="4" />
              <circle cx="183" cy="237" r="23" stroke="#d5fc65" strokeWidth="3" />
              <circle cx="439" cy="237" r="43" fill="#252a25" stroke="#f2f2e8" strokeWidth="4" />
              <circle cx="439" cy="237" r="23" stroke="#d5fc65" strokeWidth="3" />
            </svg>
            <div className="panel-bottom"><span>ZG CUSTOMS</span><span className="panel-mark">↗</span></div>
          </div>
        </section>
        <section id="usluge" className="services" aria-labelledby="services-title">
          <div className="section-heading"><div><p className="eyebrow">BRIGA O VOZILU</p><h2 id="services-title">Za svaki sljedeći kilometar.</h2></div><p>Vrste servisa u našoj početnoj ponudi.</p></div>
          <div role="status" aria-live="polite">
            {state === 'loading' && <p className="notice">Učitavamo vrste servisa…</p>}
            {state === 'error' && <p className="notice">Vrste servisa trenutačno nisu dostupne. Pokušajte osvježiti stranicu za nekoliko trenutaka.</p>}
            {state === 'ready' && services.length === 0 && <p className="notice">Vrste servisa uskoro će biti dodane.</p>}
          </div>
          {state === 'ready' && <div className="service-grid">{services.map((service, index) => (
            <article className="service" key={service.id}><span className="service-number">{String(index + 1).padStart(2, '0')}</span><h3>{service.name}</h3><p>{service.description}</p></article>
          ))}</div>}
        </section>
      </main>
      <footer className="footer wrap"><span>ZG Customs © 2026</span><span>Studentski projekt · FER · Programsko inženjerstvo</span><a href="https://github.com/ZG-Customs/ZG-Customs">Projekt na GitHubu ↗</a></footer>
    </>
  );
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
