/**
 * ============================
 * AUTH SERVICE (FRONT)
 * ============================
 * Actuellement : mock
 * Futur : API Flask + PostgreSQL
 */

// ============================
// FUTURE TABLE "users"
// id | email | password | role | created_at
// ============================

export async function loginUser(email: string, password: string) {
  // ============================
  // FUTUR CODE (EXEMPLE)
  // ============================
  /*
  const response = await fetch("http://localhost:5000/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })

  return response.json()
  */

  // ============================
  // TEMPORAIRE (MOCK)
  // ============================
  if (email === "patient@test.com" && password === "123456") {
    return {
      email,
      role: "patient",
      token: "fake-jwt-token",
    }
  }

  throw new Error("Invalid credentials")
}