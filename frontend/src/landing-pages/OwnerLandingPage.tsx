import { WorkshopAccount } from "../auth/WorkshopAccount";

export default function OwnerLandingPage() {
    return (
        <section aria-labelledby="owner-title">
            <header className="hero">
                <div className="hero-copy">
                    <h1 id="owner-title">Vlasnici automobila</h1>
                </div>
            </header>

            <WorkshopAccount role="OWNER" />

            <p className="catalog">
                <a href="/">← Povratak na početnu</a>
            </p>
        </section>
    );
}
