interface ISession {
    id: string,
    user_agent: string,
    ip_address: string,
    created_at: string,
    expires_at: string,
    is_current: boolean
}

interface ISessionResponse {
    sessions: ISession[],
    total_sessions: number,
    message: string
}