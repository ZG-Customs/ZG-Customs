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
    <main>
      <h1>ZG Customs</h1>
      <p>Početna testna stranica projekta AutoServis.</p>
      <p>Aplikacija je tek u razvoju. Prijava i naručivanje još nisu dostupni.</p>
      <hr />
      <h2>Vrste servisa</h2>
      <div role="status" aria-live="polite">
        {state === 'loading' && <p>Učitavanje podataka…</p>}
        {state === 'error' && <p>Podatke trenutačno nije moguće učitati. Pokušajte osvježiti stranicu.</p>}
        {state === 'ready' && <p>Veza s backendom i bazom radi.</p>}
      </div>
      {state === 'ready' && (
        services.length > 0
          ? <ul>{services.map((service) => <li key={service.id}><strong>{service.name}</strong> — {service.description}</li>)}</ul>
          : <p>Još nema dodanih vrsta servisa.</p>
      )}
      <footer>Programsko inženjerstvo · FER · 2026./2027.</footer>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
