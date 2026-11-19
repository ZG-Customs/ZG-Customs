import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { read, RequestList, WorkshopAccount } from "./auth/WorkshopAccount";
import type { RequestRow, WorkshopAccountState } from "./auth/WorkshopAccount";

export default function MechanicLandingPage() {
  return (
    <section aria-labelledby="role-title">
      <header className="hero">
        <div className="hero-copy">
          <h1 id="role-title">
            Mehaničari
          </h1>
          <p className="hero-description">
            Odaberite autoservis i pošaljite zahtjev za članstvo.
          </p>
        </div>
      </header>

      <WorkshopAccount role="MECHANIC">
        {(state) => state.account.status === 'PENDING' && <WorkshopMembership {...state} />}
      </WorkshopAccount>

      <p className="catalog"><a href="/">← Povratak na početnu</a></p>
    </section>
  );
}

type Workshop = { id: number; name: string };

function WorkshopMembership({ busy, revision, submit }: WorkshopAccountState) {
  const [data, setData] = useState<{ rows: RequestRow[]; workshops: Workshop[]; revision: number }>();
  const [failedRevision, setFailedRevision] = useState(-1);

  useEffect(() => {
    let active = true;
    void Promise.all([
      read<RequestRow[]>('/api/onboarding/mine'),
      read<Workshop[]>('/api/workshops'),
    ]).then(([rows, workshops]) => {
      if (active) setData({ rows, workshops, revision });
    }, () => {
      if (active) setFailedRevision(revision);
    });
    return () => { active = false; };
  }, [revision]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const workshop = new FormData(event.currentTarget).get('workshop');
    void submit(`/api/workshops/${Number(workshop)}/membership-requests`);
  }

  if (failedRevision === revision) return <p role="alert">Autoservise i zahtjeve nije moguće učitati.</p>;
  if (data?.revision !== revision) return <p role="status">Učitavanje autoservisa…</p>;
  const { rows, workshops } = data;

  return (
    <>
      <p>Za aktivaciju računa potrebno je odobrenje zahtjeva.</p>
      {!rows.some((row) => row.status === 'PENDING') && (
        <form onSubmit={onSubmit}>
          <h2>Pridružite se autoservisu</h2>
          <label>Autoservis
            <select name="workshop" required>
              <option value="">Odaberite autoservis</option>
              {workshops.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <button disabled={busy || workshops.length === 0}>Pošalji zahtjev</button>
        </form>
      )}
      <RequestList rows={rows} />
    </>
  );
}
