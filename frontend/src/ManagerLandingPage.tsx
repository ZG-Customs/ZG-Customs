import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { read, RequestList, WorkshopAccount } from "./auth/WorkshopAccount";
import type { RequestRow, WorkshopAccountState } from "./auth/WorkshopAccount";

export default function ManagerLandingPage() {
  return (
    <section aria-labelledby="role-title">
      <header className="hero">
        <div className="hero-copy">
          <h1 id="role-title">
            Vlasnici autoservisa
          </h1>
          <p className="hero-description">
            Registrirajte autoservis i upravljajte zahtjevima mehaničara za članstvo.
          </p>
        </div>
      </header>

      <WorkshopAccount role="MANAGER">
        {(state) => <ManagerWorkshop {...state} />}
      </WorkshopAccount>

      <p className="catalog"><a href="/">← Povratak na početnu</a></p>
    </section>
  );
}

function WorkshopRegistrationForm({
  busy,
  submit,
}: {
  busy: boolean;
  submit: (path: string, body: object) => Promise<void>;
}) {
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    void submit("/api/workshop-applications", {
      name: data.get("name"),
      contactDetails: data.get("contact"),
      ownershipEvidence: data.get("ownershipEvidence"),
    });
  }

  return (
    <form onSubmit={onSubmit}>
      <h2>Registrirajte svoj autoservis</h2>
      <label>Naziv autoservisa <input name="name" required maxLength={150} /></label>
      <label>Kontakt autoservisa <input name="contact" required maxLength={300} /></label>
      <label>Dokaz vlasništva <textarea name="ownershipEvidence" required maxLength={2000} /></label>
      <button disabled={busy}>Pošalji zahtjev</button>
    </form>
  );
}

function ManagerWorkshop({ account, busy, revision, submit }: WorkshopAccountState) {
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [loadedRevision, setLoadedRevision] = useState(-1);
  const [failedRevision, setFailedRevision] = useState(-1);
  const pending = account.status === 'PENDING';
  const workshopPath = account.status === 'ACTIVE' && account.workshopId !== null
    ? `/api/workshops/${account.workshopId}` : null;

  useEffect(() => {
    let active = true;
    const requests = pending
      ? read<RequestRow[]>('/api/onboarding/mine')
      : workshopPath
        ? Promise.all([
            read<RequestRow[]>(`${workshopPath}/membership-requests`),
            read<RequestRow[]>(`${workshopPath}/mechanics`),
          ]).then(([requests, mechanics]) => [...requests, ...mechanics])
        : Promise.resolve([]);
    void requests.then((data) => {
      if (!active) return;
      setRows(data);
      setLoadedRevision(revision);
    }, () => {
      if (active) setFailedRevision(revision);
    });
    return () => { active = false; };
  }, [pending, workshopPath, revision]);

  if (failedRevision === revision) return <p role="alert">Zahtjeve nije moguće učitati.</p>;
  if (loadedRevision !== revision) return <p role="status">Učitavanje zahtjeva…</p>;

  return (
    <>
      {pending && (
        <>
          <p>Za aktivaciju računa potrebno je odobrenje zahtjeva.</p>
          {!rows.some((row) => row.status === 'PENDING') && <WorkshopRegistrationForm busy={busy} submit={submit} />}
        </>
      )}
      {workshopPath && <h2>Zahtjevi i članstva</h2>}
      <RequestList rows={rows} actions={workshopPath ? (row) => (
        row.status === 'PENDING' ? (
          <>
            <button disabled={busy} onClick={() => void submit(`/api/membership-requests/${row.id}/decision`, { decision: 'ACCEPTED' })}>Prihvati</button>
            <button disabled={busy} onClick={() => void submit(`/api/membership-requests/${row.id}/decision`, { decision: 'REJECTED' })}>Odbij</button>
          </>
        ) : row.status === 'ACCEPTED' ? (
          <button disabled={busy} onClick={() => void submit(`${workshopPath}/memberships/${row.id}`, undefined, 'DELETE')}>Ukloni</button>
        ) : null
      ) : undefined} />
    </>
  );
}
