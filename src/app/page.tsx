"use client";

import { useEffect, useState } from "react";

interface Application {
  id: string;
  jobUrl: string;
  portal: string;
  status: string;
  screenshotUrl?: string;
  error?: string;
  createdAt: string;
}

export default function Dashboard() {
  const [jobUrl, setJobUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<Application[]>([]);

  async function fetchLogs() {
    const res = await fetch("/api/jobs");
    if (res.ok) setLogs(await res.json());
  }

  useEffect(() => {
    fetchLogs();
  }, []);

  async function handleApply() {
    setLoading(true);
    try {
      await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobUrl })
      });
    } finally {
      setLoading(false);
      fetchLogs();
    }
  }

  return (
    <main className="container">
      <h1 className="title">CareerPilot AI</h1>
      <p className="subtitle">Local-first AI job application automation</p>

      <div className="card">
        <label htmlFor="jobUrl">Job posting URL (Greenhouse supported first)</label>
        <input
          id="jobUrl"
          type="url"
          placeholder="https://boards.greenhouse.io/company/jobs/12345"
          value={jobUrl}
          onChange={(e) => setJobUrl(e.target.value)}
        />
        <button onClick={handleApply} disabled={loading || !jobUrl}>
          {loading ? "Running..." : "Start Application"}
        </button>
      </div>

      <div className="card">
        <h2>Application History</h2>
        {logs.length === 0 && <p className="subtitle">No applications yet.</p>}
        {logs.map((log) => (
          <div className="log-row" key={log.id}>
            <span>{log.portal} &mdash; {log.jobUrl}</span>
            <span className={`status-${log.status}`}>{log.status}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
