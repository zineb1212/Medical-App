
const API_URL = 'http://localhost:5000/api/access';

export const accessService = {
    requestAccess: async (patientId: string, message: string, duration: string, token: string) => {
        const response = await fetch(`${API_URL}/request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ patient_id: patientId, request_message: message, duration: duration })
        });
        return response.json();
    },

    getRequests: async (token: string) => {
        const response = await fetch(`${API_URL}/requests`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.json();
    },

    grantAccess: async (requestId: number, token: string) => {
        const response = await fetch(`${API_URL}/grant`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ request_id: requestId })
        });
        return response.json();
    },

    revokeAccess: async (requestId: number | null, doctorId: string | null, token: string) => {
        const response = await fetch(`${API_URL}/revoke`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ request_id: requestId, doctor_id: doctorId })
        });
        return response.json();
    },

    checkStatus: async (patientId: string, token: string) => {
        const res = await fetch(`${API_URL}/status?patient_id=${patientId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        if (!res.ok) throw new Error("Failed to check status")
        return res.json()
    },

    deleteRequest: async (requestId: number, token: string) => {
        const res = await fetch(`${API_URL}/request/${requestId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        if (!res.ok) throw new Error("Failed to delete request")
        return res.json()
    },

    // Access Logging
    logAccess: async (patientId: string, sections: string, token: string) => {
        const res = await fetch(`${API_URL}/log-access`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ patient_id: patientId, sections_viewed: sections })
        })
        if (!res.ok) throw new Error("Failed to log access")
        return res.json()
    },

    getAccessHistory: async (patientId: string, token: string) => {
        const res = await fetch(`${API_URL}/history/${patientId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        if (!res.ok) throw new Error("Failed to get history")
        return res.json()
    },

    addConsultationNote: async (logId: number, note: string | null, action: string | null, token: string) => {
        const res = await fetch(`${API_URL}/consultation-note`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ log_id: logId, note, action })
        })
        if (!res.ok) throw new Error("Failed to add note")
        return res.json()
    },

    getPatients: async () => {
        const response = await fetch('http://localhost:5000/api/contacts?role=patient');
        return response.json();
    }
};
