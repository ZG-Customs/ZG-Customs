export type Vehicle = {
    id: number;
    registration: string;
    make: string;
    model: string;
    productionYear: number;
    mileage: number;
};

export type VehicleRegistration = Omit<Vehicle, "id">;

async function request(path: string, options?: RequestInit) {
    const response = await fetch(path, { credentials: "same-origin", ...options });
    if (!response.ok) {
        if (response.status === 401) throw new Error("Prijavite se za upravljanje vozilima.");
        if (response.status === 403)
            throw new Error("Za ovu radnju potreban je aktivan račun vlasnika vozila.");
        if (response.status === 400)
            throw new Error("Provjerite unesene podatke i pokušajte ponovno.");
        throw new Error("Zahtjev nije uspio. Pokušajte ponovno.");
    }
    return response;
}

async function mutation(method: "POST" | "DELETE", path: string, body?: VehicleRegistration) {
    const csrfResponse = await request("/api/auth/csrf");
    const csrf: { headerName: string; token: string } = await csrfResponse.json();
    return request(path, {
        method,
        headers: { [csrf.headerName]: csrf.token, "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
    });
}

export async function getVehicles(signal?: AbortSignal): Promise<Vehicle[]> {
    const response = await request("/api/vehicles", { signal });
    return response.json();
}

export async function createVehicle(data: VehicleRegistration): Promise<Vehicle> {
    const response = await mutation("POST", "/api/vehicles", data);
    return response.json();
}

export async function deleteVehicle(id: number): Promise<void> {
    await mutation("DELETE", `/api/vehicles/${id}`);
}
