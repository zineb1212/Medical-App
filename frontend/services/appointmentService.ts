import { format } from "date-fns"

const API_URL = "http://127.0.0.1:5000/api"

export interface Appointment {
    id: number
    doctor_id: string
    patient_id: string
    patient_name: string
    patient_avatar?: string
    doctor_name: string
    date: string
    time: string
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
    type: string
    mode: 'in-person' | 'video'
    notes?: string
    created_at: string
}

export const appointmentService = {
    async getAppointments(date?: Date): Promise<Appointment[]> {
        const token = localStorage.getItem('token')
        let url = `${API_URL}/appointments`
        if (date) {
            const dateStr = format(date, 'yyyy-MM-dd')
            url += `?date=${dateStr}`
        }

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        if (!response.ok) throw new Error("Failed to fetch appointments")
        return response.json()
    },

    async createAppointment(data: Partial<Appointment>): Promise<Appointment> {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/appointments`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(data),
        })
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || "Failed to create appointment");
        }
        return response.json()
    },

    async updateStatus(id: number, status: string): Promise<Appointment> {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/appointments/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ status }),
        })
        if (!response.ok) throw new Error("Failed to update appointment")
        return response.json()
    },

    async deleteAppointment(id: number): Promise<void> {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/appointments/${id}`, {
            method: "DELETE",
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        if (!response.ok) throw new Error("Failed to delete appointment")
    }
}
