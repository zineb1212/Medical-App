

const API_URL = "http://localhost:5000/api"

export interface MedicalRecord {
    id: number
    user_id: string
    date_of_birth: string | null
    gender: string
    blood_type: string
    height: number
    weight: number
    allergies: string
    chronic_conditions: string
    current_medications: string
    family_history: string
    emergency_contact_name: string
    emergency_contact_phone: string
    general_observations: string
    current_symptoms: string
    updated_at: string
    folders: MedicalFolder[]
    root_documents: MedicalDocument[]
}

export interface MedicalFolder {
    id: number
    name: string
    description: string
    date: string
    sharedWith: string[]
    color: string
    files: MedicalDocument[]
}

export interface MedicalDocument {
    id: number
    name: string
    file_url: string
    type: string
    date: string
    size: string
    folder_id?: number
}

export const medicalService = {
    async getRecord(userId: string): Promise<MedicalRecord> {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/medical-record?user_id=${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || "Failed to fetch medical record");
        }
        return response.json()
    },

    async updateRecord(data: Partial<MedicalRecord> & { user_id: string }): Promise<MedicalRecord> {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/medical-record`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(data),
        })
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || "Failed to update medical record");
        }
        return response.json()
    },

    async createFolder(userId: string, name: string, description: string): Promise<MedicalFolder> {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/medical-record/folders`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ user_id: userId, name, description }),
        })
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || "Failed to create folder");
        }
        return response.json()
    },

    async deleteFolder(folderId: number): Promise<void> {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/medical-record/folders/${folderId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
        if (!response.ok) throw new Error("Failed to delete folder")
    },

    async uploadDocument(file: File, userId: string, folderId?: number): Promise<MedicalDocument> {
        const token = localStorage.getItem('token')
        const formData = new FormData()
        formData.append("file", file)
        formData.append("user_id", userId)
        if (folderId) formData.append("folder_id", folderId.toString())

        const response = await fetch(`${API_URL}/medical-record/documents`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            },
            body: formData,
        })
        if (!response.ok) throw new Error("Failed to upload document")
        return response.json()
    },

    async deleteDocument(docId: number): Promise<void> {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/medical-record/documents/${docId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
        if (!response.ok) throw new Error("Failed to delete document")
    },
}
