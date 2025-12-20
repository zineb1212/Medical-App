const API_URL = "http://localhost:5000/api"

export interface Message {
    id: number
    sender_id: string
    receiver_id: string
    content: string
    timestamp: string
    read: boolean
    attachment_url?: string
    attachment_type?: string
}

export const chatService = {
    async sendMessage(senderId: string, receiverId: string, content: string): Promise<Message> {
        const response = await fetch(`${API_URL}/messages`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                sender_id: senderId,
                receiver_id: receiverId,
                content
            })
        })
        if (!response.ok) {
            throw new Error("Failed to send message")
        }
        return response.json()
    },

    async getMessages(user1Id: string, user2Id: string): Promise<Message[]> {
        const response = await fetch(`${API_URL}/messages?user1_id=${user1Id}&user2_id=${user2Id}`)
        if (!response.ok) {
            throw new Error("Failed to fetch messages")
        }
        return response.json()
    }
}
