import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';

type Account = {
  id: number;
  role: 'OWNER' | 'MECHANIC' | 'MANAGER' | 'ADMIN' | null;
  status: 'UNREGISTERED' | 'PENDING' | 'ACTIVE' | 'DEACTIVATED';
  workshopId: number | null;
};
type RequestRow = { id: number; name: string; status: string; contactDetails?: string; ownershipEvidence?: string };
type Workshop = { id: number; name: string };

async function read<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) throw new Error(String(response.status));
  return response.json() as Promise<T>;
}

async function write(path: string, body?: object, method = 'POST') {
  const csrf = await read<{ headerName: string; token: string }>('/api/auth/csrf');
  const response = await fetch(path, {
    method,
    headers: { [csrf.headerName]: csrf.token, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) throw new Error(String(response.status));
}

async function loadAccount() {
  try {
    return await read<Account>('/api/me');
  } catch (error) {
    if (error instanceof Error && error.message === '401') return null;
    throw error;
  }
}

export function AccountPanel() {
  const [account, setAccount] = useState<Account | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [role, setRole] = useState('OWNER');
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);

  async function refresh() {
    const [provider, current] = await Promise.all([
      read<{ enabled: boolean }>('/api/auth/provider'), loadAccount(),
    ]);
    setEnabled(provider.enabled);
    setAccount(current);
    const admin = current?.status === 'ACTIVE' && current.role === 'ADMIN';
    const workshopPath = current?.status === 'ACTIVE' && current.role === 'MANAGER' && current.workshopId !== null
      ? `/api/workshops/${current.workshopId}` : '';
    const pending = current?.status === 'PENDING';
    const [requests, team, options] = await Promise.all([
      admin ? read<RequestRow[]>('/api/admin/workshop-applications')
        : workshopPath ? read<RequestRow[]>(`${workshopPath}/membership-requests`)
          : pending ? read<RequestRow[]>('/api/onboarding/mine') : [],
      workshopPath ? read<RequestRow[]>(`${workshopPath}/mechanics`) : [],
      pending && current.role === 'MECHANIC' ? read<Workshop[]>('/api/workshops') : [],
    ]);
    setRows([...requests, ...team]);
    setWorkshops(options);
  }

  useEffect(() => {
    void refresh()
      .catch(() => setError('Podatke o računu trenutačno nije moguće učitati.'))
      .finally(() => setLoading(false));
  }, []);

  async function submit(path: string, data?: object, method?: string) {
    setError('');
    setBusy(true);
    try {
      await write(path, data, method);
      await refresh();
    } catch (failure) {
      setError(failure instanceof Error && failure.message === '409'
        ? 'Zahtjev je već obrađen ili odabrani autoservis više nije dostupan.'
        : 'Radnju nije moguće izvršiti. Osvježite stranicu i pokušajte ponovno.');
    } finally {
      setBusy(false);
    }
  }

  function onRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    void submit('/api/auth/register', {
      role, contact: data.get('contact'), specializations: data.get('specializations'),
    });
  }

  function onRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (account?.role === 'MECHANIC') {
      void submit(`/api/workshops/${Number(data.get('workshop'))}/membership-requests`);
    } else {
      void submit('/api/workshop-applications', {
        name: data.get('name'), contactDetails: data.get('contact'), ownershipEvidence: data.get('ownershipEvidence'),
      });
    }
  }

  if (loading) return <p role="status">Učitavanje računa…</p>;
  const approvalPath = account?.status === 'ACTIVE' && account.role === 'ADMIN'
    ? '/api/admin/workshop-applications'
    : account?.status === 'ACTIVE' && account.role === 'MANAGER' && account.workshopId !== null
      ? '/api/membership-requests' : '';

  return (
    <section className="catalog account">
      {error && <p role="alert">{error}</p>}
      {!account && enabled && <a href="/api/auth/login/external">Prijava vanjskim računom</a>}
      {!account && !enabled && <p>Vanjska prijava trenutačno nije dostupna.</p>}
      {!account && new URLSearchParams(window.location.search).get('login') === 'failed'
        && <p role="alert">Prijava nije uspjela.</p>}
      {account && <button type="button" disabled={busy} onClick={() => void submit('/api/auth/logout')}>Odjava</button>}
      {account?.status === 'UNREGISTERED' && (
        <form onSubmit={onRegister}>
          <label>Uloga
            <select value={role} onChange={(event) => setRole(event.target.value)}>
              <option value="OWNER">Vlasnik vozila</option>
              <option value="MECHANIC">Serviser</option>
              <option value="MANAGER">Voditelj</option>
            </select>
          </label>
          <label>Kontakt <input name="contact" required maxLength={300} /></label>
          {role === 'MECHANIC' && <label>Specijalizacije <input name="specializations" maxLength={500} /></label>}
          <button disabled={busy}>Registriraj se</button>
        </form>
      )}
      {account?.status === 'ACTIVE' && <p>Račun je aktivan.</p>}
      {account?.status === 'PENDING' && (
        <>
          <p>Za aktivaciju računa potrebno je odobrenje zahtjeva.</p>
          {!rows.some((row) => row.status === 'PENDING') && (
            <form onSubmit={onRequest}>
              {account.role === 'MECHANIC' ? (
                <label>Autoservis
                  <select name="workshop" required>
                    <option value="">Odaberite autoservis</option>
                    {workshops.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </label>
              ) : (
                <>
                  <label>Naziv autoservisa <input name="name" required maxLength={160} /></label>
                  <label>Kontakt autoservisa <input name="contact" required maxLength={300} /></label>
                  <label>Dokaz vlasništva <textarea name="ownershipEvidence" required maxLength={2000} /></label>
                </>
              )}
              <button disabled={busy || (account.role === 'MECHANIC' && workshops.length === 0)}>Pošalji zahtjev</button>
            </form>
          )}
        </>
      )}
      {approvalPath && <h2>Zahtjevi i članstva</h2>}
      {rows.length > 0 && <ul>
        {rows.map((row) => (
          <li key={row.id}>
            {row.name} — {{ PENDING: 'na čekanju', ACCEPTED: 'prihvaćen', REJECTED: 'odbijen', REMOVED: 'uklonjen' }[row.status] ?? row.status}
            {row.contactDetails && <p>Kontakt: {row.contactDetails}</p>}
            {row.ownershipEvidence && <p>Dokaz vlasništva: {row.ownershipEvidence}</p>}
            {approvalPath && row.status === 'PENDING' && (
              <>
                <button disabled={busy} onClick={() => void submit(`${approvalPath}/${row.id}/decision`, { decision: 'ACCEPTED' })}>Prihvati</button>
                <button disabled={busy} onClick={() => void submit(`${approvalPath}/${row.id}/decision`, { decision: 'REJECTED' })}>Odbij</button>
              </>
            )}
            {approvalPath === '/api/membership-requests' && row.status === 'ACCEPTED' &&
              <button disabled={busy} onClick={() => void submit(
                `/api/workshops/${account?.workshopId}/memberships/${row.id}`, undefined, 'DELETE',
              )}>Ukloni</button>}
          </li>
        ))}
      </ul>}
    </section>
  );
}
