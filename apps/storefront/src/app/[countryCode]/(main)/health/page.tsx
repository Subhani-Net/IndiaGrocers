/**
 * /[countryCode]/health
 *
 * Ops health check page. Calls the Medusa backend /health endpoint and
 * displays the service statuses. Used by ops to confirm deployments are
 * healthy without accessing the admin.
 *
 * US-01-08
 */

const BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL ?? "http://localhost:9000"

type ServiceStatus = "ok" | "error" | "not_configured"

interface HealthResponse {
  status: "ok" | "degraded"
  timestamp: string
  services: Record<string, ServiceStatus>
}

const STATUS_STYLES: Record<ServiceStatus, string> = {
  ok: "bg-green-100 text-green-800",
  error: "bg-red-100 text-red-800",
  not_configured: "bg-gray-100 text-gray-500",
}

const STATUS_LABELS: Record<ServiceStatus, string> = {
  ok: "OK",
  error: "ERROR",
  not_configured: "Not configured",
}

async function getHealth(): Promise<HealthResponse | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/health`, {
      next: { revalidate: 0 }, // Always fresh
    })
    return (await res.json()) as HealthResponse
  } catch {
    return null
  }
}

export default async function HealthPage() {
  const health = await getHealth()

  if (!health) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold text-red-700 mb-2">
          Backend Unreachable
        </h1>
        <p className="text-sm text-gray-500">
          Could not connect to {BACKEND_URL}/health
        </p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-xl font-semibold">System Health</h1>
        <span
          className={`px-2 py-0.5 rounded text-xs font-medium ${
            health.status === "ok"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {health.status.toUpperCase()}
        </span>
      </div>

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left py-1 pr-4 font-medium text-gray-600">
              Service
            </th>
            <th className="text-left py-1 font-medium text-gray-600">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(health.services).map(([name, status]) => (
            <tr key={name} className="border-b last:border-0">
              <td className="py-2 pr-4 capitalize">{name}</td>
              <td className="py-2">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[status]}`}
                >
                  {STATUS_LABELS[status]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-4 text-xs text-gray-400">
        Checked at {new Date(health.timestamp).toLocaleString("en-GB")}
      </p>
    </div>
  )
}
