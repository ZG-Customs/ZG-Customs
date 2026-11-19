import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { AccountPanel } from "./AccountPanel";

export type Account = {
  id: number;
  role: 'OWNER' | 'MECHANIC' | 'MANAGER' | 'ADMIN' | null;
  status: 'UNREGISTERED' | 'PENDING' | 'ACTIVE' | 'DEACTIVATED';
  workshopId: number | null;
  contactEmail: string | null;
};
export type RequestRow = { id: number; name: string; status: string; };

export async function read<T>(path: string): Promise<T> {
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

export async function loadAccount() {
  try {
    return await read<Account>('/api/me');
  } catch (error) {
    if (error instanceof Error && error.message === '401') return null;
    throw error;
  }
}

type LoginRole = 'OWNER' | 'MANAGER' | 'MECHANIC';

export const LOGIN_INTENT = 'zg-customs:workshop-login';
const LOGIN_TIMEOUT = 15 * 60 * 1000;
const LOGIN_URL = '/api/auth/login/external';

export const workshopPages = {
  OWNER: '/login/user',
  MANAGER: '/login/manager',
  MECHANIC: '/login/mechanic',
} as const;

function beginLogin(role: LoginRole) {
  sessionStorage.setItem(LOGIN_INTENT, JSON.stringify({
    role, expiresAt: Date.now() + LOGIN_TIMEOUT, stage: 'sign-in',
  }));
}

export function getWorkshopLogin(): {
  role: LoginRole;
  expiresAt: number;
  stage: 'sign-in' | 'registration';
} | null {
  try {
    const intent = JSON.parse(sessionStorage.getItem(LOGIN_INTENT) ?? 'null');
    if ((intent?.role === 'OWNER' || intent?.role === 'MANAGER' || intent?.role === 'MECHANIC') &&
        (intent.stage === 'sign-in' || intent.stage === 'registration') &&
        typeof intent.expiresAt === 'number' && intent.expiresAt > Date.now()) {
      return intent;
    }
  } catch {
    return null;
  }
  return null;
}

async function registerAccount(role: LoginRole, identity: Account) {
  await write('/api/auth/register', { role, contact: identity.contactEmail?.trim() });
  return loadAccount();
}

export type WorkshopAccountState = {
  account: Account;
  busy: boolean;
  revision: number;
  submit: (path: string, data?: object, method?: string) => Promise<void>;
};

export function WorkshopAccount({ role, children }: {
  role: LoginRole;
  children?: (state: WorkshopAccountState) => ReactNode;
}) {
  const [returnedFromWorkshopLogin] = useState(() => {
    const intent = getWorkshopLogin();
    return intent?.stage === 'registration' && intent.role === role;
  });
  const [account, setAccount] = useState<Account | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const automaticRegistration = useRef<Promise<Account | null> | undefined>(undefined);

  async function refresh() {
    const [provider, identity] = await Promise.all([
      read<{ enabled: boolean }>('/api/auth/provider'), loadAccount(),
    ]);
    setEnabled(provider.enabled);
    let current = identity;
    if (role !== 'OWNER' && returnedFromWorkshopLogin && current?.status === 'UNREGISTERED' &&
        current.contactEmail?.trim()) {
      automaticRegistration.current ??= registerAccount(role, current);
      try {
        current = await automaticRegistration.current;
        sessionStorage.removeItem(LOGIN_INTENT);
      } catch {
        setError('Automatska registracija nije uspjela. Unesite kontakt i pokušajte ponovno.');
      }
    }
    if (returnedFromWorkshopLogin && current?.status !== 'UNREGISTERED') {
      sessionStorage.removeItem(LOGIN_INTENT);
    }
    setAccount(current);
  }

  useEffect(() => {
    void refresh()
      .catch(() => setError('Podatke o računu trenutačno nije moguće učitati.'))
      .finally(() => setLoading(false));
  }, [role]);

  async function submit(path: string, data?: object, method?: string) {
    setError('');
    setBusy(true);
    try {
      await write(path, data, method);
      await refresh();
      setRevision((value) => value + 1);
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
    void submit('/api/auth/register', { role, contact: data.get('contact') });
  }

  if (loading) return <p role="status">Učitavanje računa…</p>;
  if (role === 'OWNER' && account?.role === 'ADMIN') {
    return <AccountPanel onSignedOut={() => setAccount(null)} />;
  }
  const pageAccount = account?.role === role ? account : null;
  const needsContact = (returnedFromWorkshopLogin || role === 'OWNER') && account?.status === 'UNREGISTERED';

  return (
    <section className="catalog account">
      {error && <p role="alert">{error}</p>}
      {!pageAccount && !needsContact && enabled && (
        <a className="primary-button" href={LOGIN_URL} onClick={(event) => {
          event.preventDefault();
          beginLogin(role);
          window.location.assign(LOGIN_URL);
        }}>Prijava</a>
      )}
      {!pageAccount && !needsContact && !enabled && !error && <p>Vanjska prijava trenutačno nije dostupna.</p>}
      {new URLSearchParams(window.location.search).get('login') === 'failed'
        && <p role="alert">Prijava nije uspjela. Provjerite koristite li račun za ovu stranicu.</p>}
      {account?.role && !pageAccount && <p>Za ovu stranicu prijavite se računom odgovarajuće uloge.</p>}
      {account && <button type="button" disabled={busy} onClick={() => {
        sessionStorage.removeItem(LOGIN_INTENT);
        void submit('/api/auth/logout');
      }}>Odjava</button>}
      {needsContact && (
        <form key={account.id} onSubmit={onRegister}>
          <p>Za dovršetak registracije provjerite ili unesite kontakt.</p>
          <label>Kontakt <input name="contact" defaultValue={account.contactEmail?.trim() ?? ''} required maxLength={300} /></label>
          <button disabled={busy}>Registriraj se</button>
        </form>
      )}
      {pageAccount?.status === 'ACTIVE' && <p>Račun je aktivan.</p>}
      {pageAccount && children?.({ account: pageAccount, busy, revision, submit })}
    </section>
  );
}

export function RequestList({ rows, actions }: {
  rows: RequestRow[];
  actions?: (row: RequestRow) => ReactNode;
}) {
  const labels: Record<string, string> = {
    PENDING: 'na čekanju', ACCEPTED: 'prihvaćen', REJECTED: 'odbijen', REMOVED: 'uklonjen',
  };
  return rows.length > 0 && (
    <ul>
      {rows.map((row) => (
        <li key={row.id}>
          {row.name} — {labels[row.status] ?? row.status}
          {actions?.(row)}
        </li>
      ))}
    </ul>
  );
}
