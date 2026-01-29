import { socketUserMap } from '../socket';

const GAMES_ADMIN_URL = process.env.GAMES_ADMIN_API_URL || 'https://admin.mysys.shop';

interface SessionResponse {
  success: boolean;
  session?: {
    id: string;
    started_at: string;
    type: string;
  };
}

// Store active match sessions by room code
const activeMatchSessions: Map<string, string> = new Map();

export async function startMatchSession(roomCode: string, playerSocketIds: string[]): Promise<string | null> {
  try {
    // Get first authenticated player's token
    for (const socketId of playerSocketIds) {
      const userData = socketUserMap.get(socketId);
      if (userData?.token) {
        const response = await fetch(`${GAMES_ADMIN_URL}/api/games/BANGSHOT/sessions/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userData.token}`,
          },
          body: JSON.stringify({ type: 'match' }),
        });

        if (response.ok) {
          const data = await response.json() as SessionResponse;
          if (data.session?.id) {
            activeMatchSessions.set(roomCode, data.session.id);
            console.log(`[Session] Match session started: ${data.session.id} for room ${roomCode}`);
            return data.session.id;
          }
        }
      }
    }
  } catch (error) {
    console.error('[Session] Error starting match session:', error);
  }
  return null;
}

export async function endMatchSession(roomCode: string, playerSocketIds: string[]): Promise<boolean> {
  const sessionId = activeMatchSessions.get(roomCode);
  if (!sessionId) {
    console.log(`[Session] No active session for room ${roomCode}`);
    return false;
  }

  try {
    for (const socketId of playerSocketIds) {
      const userData = socketUserMap.get(socketId);
      if (userData?.token) {
        const response = await fetch(`${GAMES_ADMIN_URL}/api/games/BANGSHOT/sessions/end`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userData.token}`,
          },
          body: JSON.stringify({ session_id: sessionId }),
        });

        if (response.ok) {
          activeMatchSessions.delete(roomCode);
          console.log(`[Session] Match session ended: ${sessionId} for room ${roomCode}`);
          return true;
        }
      }
    }
  } catch (error) {
    console.error('[Session] Error ending match session:', error);
  }
  return false;
}
