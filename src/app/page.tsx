export default function Home() {
  return <main style={{ maxWidth: "65ch", margin: "3rem auto", padding: "0 1rem", fontFamily: "system-ui", lineHeight: 1.6 }}>
    <h1>Home Notification Hub</h1>
    <p>Development foundation is running.</p>
    <p>Authentication, device registration, and messaging are planned. No household devices are connected.</p>
    <p>This diagnostic page is for local development. Household access requires the authentication and HTTPS milestones.</p>
    <a href="/api/health">Check application health</a>
  </main>;
}
