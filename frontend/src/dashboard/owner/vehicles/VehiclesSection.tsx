import { useEffect, useRef, useState } from "react";
import type { ReactNode, SubmitEvent } from "react";
import type { Vehicle, VehicleRegistration } from "./vehiclesApi";
import { createVehicle, deleteVehicle, getVehicles } from "./vehiclesApi";

function errorMessage(error: unknown) {
    return error instanceof Error ? error.message : "Zahtjev nije uspio. Pokušajte ponovno.";
}

function VehicleCard({
    vehicle,
    onDelete,
}: {
    vehicle: Vehicle;
    onDelete: (id: number) => void;
}) {
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState("");
    const pending = useRef(false);

    async function remove() {
        if (pending.current) return;
        pending.current = true;
        setDeleting(true);
        setError("");
        try {
            await deleteVehicle(vehicle.id);
            onDelete(vehicle.id);
        } catch (failure) {
            setError(errorMessage(failure));
        } finally {
            pending.current = false;
            setDeleting(false);
        }
    }

    return (
        <article aria-busy={deleting}>
            <h3>
                {vehicle.make} {vehicle.model}
            </h3>
            <p>
                {vehicle.registration} · {vehicle.productionYear}.
            </p>
            <div className="dashboard-card-footer">
                <button
                    type="button"
                    className="dashboard-text-button">
                    Detalji vozila ↗
                </button>
                <button
                    type="button"
                    className="dashboard-text-button dashboard-danger"
                    disabled={deleting}
                    onClick={() => void remove()}
                    aria-label={`Izbriši vozilo ${vehicle.registration}`}>
                    {deleting ? "Brisanje…" : "Izbriši"}
                </button>
            </div>
            {error && <p role="alert">{error}</p>}
        </article>
    );
}

function VehicleModal({ children, onClose }: {
    children: ReactNode;
    onClose: () => void;
}) {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = dialogRef.current!;
        const previousOverflow = document.body.style.overflow;
        dialog.showModal();
        document.body.style.overflow = "hidden";
        return () => {
            dialog.close();
            document.body.style.overflow = previousOverflow;
        };
    }, []);

    return (
        <dialog
            ref={dialogRef}
            className="dashboard-vehicle-modal"
            aria-labelledby="add-vehicle-title"
            onCancel={(event) => {
                event.preventDefault();
                onClose();
            }}
            onClick={(event) => {
                if (event.target !== event.currentTarget) return;
                const bounds = event.currentTarget.getBoundingClientRect();
                if (event.clientX < bounds.left || event.clientX > bounds.right ||
                    event.clientY < bounds.top || event.clientY > bounds.bottom) {
                    onClose();
                }
            }}>
            {children}
        </dialog>
    );
}

function AddVehicleForm({
    onCreated,
    onCancel,
}: {
    onCreated: (vehicle: Vehicle) => void;
    onCancel: () => void;
}) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const pending = useRef(false);

    async function submit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        if (pending.current) return;
        const data = new FormData(event.currentTarget);
        const vehicle: VehicleRegistration = {
            registration: String(data.get("registration")).trim(),
            make: String(data.get("make")).trim(),
            model: String(data.get("model")).trim(),
            productionYear: Number(data.get("productionYear")),
            mileage: Number(data.get("mileage")),
        };
        if (!vehicle.registration || !vehicle.make || !vehicle.model) {
            setError("Registracija, marka i model ne smiju biti prazni.");
            return;
        }
        pending.current = true;
        setSaving(true);
        setError("");
        try {
            onCreated(await createVehicle(vehicle));
        } catch (failure) {
            setError(errorMessage(failure));
        } finally {
            pending.current = false;
            setSaving(false);
        }
    }

    return (
        <form
            id="add-vehicle-form"
            className="dashboard-vehicle-form"
            onSubmit={submit}
            aria-busy={saving}>
            <h3 id="add-vehicle-title">Novo vozilo</h3>
            <fieldset disabled={saving}>
                <label>
                    Registracija
                    <input
                        name="registration"
                        required
                        maxLength={30}
                        autoFocus
                    />
                </label>
                <label>
                    Marka
                    <input
                        name="make"
                        required
                        maxLength={100}
                    />
                </label>
                <label>
                    Model
                    <input
                        name="model"
                        required
                        maxLength={100}
                    />
                </label>
                <label>
                    Godina proizvodnje
                    <input
                        name="productionYear"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]{1,4}"
                        maxLength={4}
                        required
                        onChange={(event) => {
                            event.currentTarget.value = event.currentTarget.value.replace(/[^0-9]/g, "").slice(0, 4);
                        }}
                    />
                </label>
                <label>
                    Kilometraža (km)
                    <input
                        name="mileage"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]{1,7}"
                        maxLength={7}
                        required
                        onChange={(event) => {
                            event.currentTarget.value = event.currentTarget.value.replace(/[^0-9]/g, "").slice(0, 7);
                        }}
                    />
                </label>
            </fieldset>
            {error && <p role="alert">{error}</p>}
            <button
                type="submit"
                className="dashboard-button dashboard-add-vehicle"
                disabled={saving}>
                {saving ? "Spremanje…" : "Dodaj vozilo"} <span aria-hidden="true">＋</span>
            </button>
            <button
                type="button"
                className="dashboard-text-button"
                disabled={saving}
                onClick={onCancel}>
                Odustani
            </button>
        </form>
    );
}

export default function VehiclesSection() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [retry, setRetry] = useState(0);
    const [adding, setAdding] = useState(false);
    const addButton = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError("");
        getVehicles(controller.signal)
            .then((data) => {
                if (!controller.signal.aborted) setVehicles(data);
            })
            .catch((failure: unknown) => {
                if (!controller.signal.aborted) setError(errorMessage(failure));
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });
        return () => controller.abort();
    }, [retry]);

    function closeForm() {
        setAdding(false);
        requestAnimationFrame(() => addButton.current?.focus());
    }

    return (
        <section
            id="vehicles"
            aria-labelledby="vehicles-title">
            <div className="dashboard-section-heading">
                <h2 id="vehicles-title">Moja vozila</h2>
            </div>
            <div className="dashboard-card dashboard-vehicles">
                {loading ? (
                    <p role="status">Učitavanje vozila…</p>
                ) : error ? (
                    <>
                        <p role="alert">{error}</p>
                        <button
                            type="button"
                            className="dashboard-text-button"
                            onClick={() => setRetry((value) => value + 1)}>
                            Pokušaj ponovno
                        </button>
                    </>
                ) : (
                    <>
                        {vehicles.length === 0 && (
                            <p>Još nemate vozila. Dodajte svoje prvo vozilo.</p>
                        )}
                        <div className={vehicles.length > 3 ? "dashboard-vehicle-list dashboard-vehicle-list-scrollable" : "dashboard-vehicle-list"}>
                        {vehicles.map((vehicle) => (
                            <VehicleCard
                                key={vehicle.id}
                                vehicle={vehicle}
                                onDelete={(id) =>
                                    setVehicles((current) =>
                                        current.filter((item) => item.id !== id),
                                    )
                                }
                            />
                        ))}
                        </div>
                        {adding && (
                            <VehicleModal onClose={closeForm}>
                            <AddVehicleForm
                                onCancel={closeForm}
                                onCreated={(vehicle) => {
                                    setVehicles((current) => [...current, vehicle]);
                                    closeForm();
                                }}
                            />
                            </VehicleModal>
                        )}
                            <button
                                ref={addButton}
                                type="button"
                                className="dashboard-button dashboard-add-vehicle"
                                aria-haspopup="dialog"
                                aria-expanded={adding}
                                onClick={() => setAdding(true)}>
                                Dodaj vozilo <span aria-hidden="true">＋</span>
                            </button>
                    </>
                )}
            </div>
        </section>
    );
}
