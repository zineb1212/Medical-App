const API_URL = "http://127.0.0.1:5000/api/ai"

export interface AIResponse {
    response?: string
    source?: string
    diagnosis?: string
    confidence?: number
    raw_scores?: Record<string, number>
    risk_score?: number
    risk_level?: string
    risk_factors?: string[]
    recommendation?: string
    error?: string
}

export const aiService = {
    async chat(query: string, context?: any): Promise<AIResponse> {
        const response = await fetch(`${API_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, context })
        })
        return response.json()
    },

    async analyzeMRI(file: File): Promise<AIResponse> {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch(`${API_URL}/analyze-mri`, {
            method: 'POST',
            body: formData
        })
        return response.json()
    },

    async analyzeRecord(userId: string): Promise<AIResponse> {
        const response = await fetch(`${API_URL}/analyze-record`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId })
        })
        return response.json()
    },

    async getHistory(userId: string): Promise<any[]> {
        const response = await fetch(`${API_URL}/history?user_id=${userId}`)
        if (!response.ok) return []
        return response.json()
    },

    async deleteHistory(historyId: number): Promise<boolean> {
        const response = await fetch(`${API_URL}/history/${historyId}`, {
            method: 'DELETE'
        })
        return response.ok
    }
}
