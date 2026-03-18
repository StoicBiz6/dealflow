import Foundation

// MARK: - Supabase Error
enum SupabaseError: LocalizedError {
    case notAuthenticated
    case networkError(String)
    case decodingError(String)
    case noData

    var errorDescription: String? {
        switch self {
        case .notAuthenticated: return "Not authenticated. Please sign in."
        case .networkError(let msg): return "Network error: \(msg)"
        case .decodingError(let msg): return "Data error: \(msg)"
        case .noData: return "No data returned."
        }
    }
}

// MARK: - Supabase Service
final class SupabaseService {
    static let shared = SupabaseService()
    private init() {}

    private var baseURL: String { Constants.supabaseURL }
    private var anonKey: String { Constants.supabaseAnonKey }

    private func authToken() throws -> String {
        guard let token = AuthService.shared.sessionToken, !token.isEmpty else {
            throw SupabaseError.notAuthenticated
        }
        return token
    }

    private func makeRequest(path: String, method: String = "GET",
                              body: Data? = nil, queryParams: String = "") async throws -> Data {
        let token = try authToken()
        let urlString = "\(baseURL)/rest/v1/\(path)\(queryParams)"
        guard let url = URL(string: urlString) else {
            throw SupabaseError.networkError("Invalid URL: \(urlString)")
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue(anonKey, forHTTPHeaderField: "apikey")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue("return=representation", forHTTPHeaderField: "Prefer")

        if let body = body {
            request.httpBody = body
        }

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw SupabaseError.networkError("No HTTP response")
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            let msg = String(data: data, encoding: .utf8) ?? "Unknown"
            throw SupabaseError.networkError("HTTP \(httpResponse.statusCode): \(msg)")
        }

        return data
    }

    // MARK: - Deals
    func fetchDeals(workspaceId: String? = nil) async throws -> [Deal] {
        var query = "?order=created_at.desc"
        if let wsId = workspaceId {
            query += "&workspace_id=eq.\(wsId)"
        } else {
            guard let userId = AuthService.shared.currentUserId else {
                throw SupabaseError.notAuthenticated
            }
            query += "&user_id=eq.\(userId)"
        }

        let data = try await makeRequest(path: "deals", queryParams: query)
        do {
            return try JSONDecoder().decode([Deal].self, from: data)
        } catch {
            throw SupabaseError.decodingError(error.localizedDescription)
        }
    }

    func fetchDeal(id: String) async throws -> Deal {
        let data = try await makeRequest(path: "deals", queryParams: "?id=eq.\(id)&limit=1")
        let deals = try JSONDecoder().decode([Deal].self, from: data)
        guard let deal = deals.first else { throw SupabaseError.noData }
        return deal
    }

    func createDeal(_ deal: Deal) async throws -> Deal {
        let encoder = JSONEncoder()
        let body = try encoder.encode(deal)
        let data = try await makeRequest(path: "deals", method: "POST", body: body)
        let deals = try JSONDecoder().decode([Deal].self, from: data)
        guard let created = deals.first else { throw SupabaseError.noData }
        return created
    }

    func updateDeal(_ deal: Deal) async throws -> Deal {
        let encoder = JSONEncoder()
        let body = try encoder.encode(deal)
        let data = try await makeRequest(path: "deals", method: "PATCH",
                                          body: body, queryParams: "?id=eq.\(deal.id)")
        let deals = try JSONDecoder().decode([Deal].self, from: data)
        guard let updated = deals.first else { throw SupabaseError.noData }
        return updated
    }

    func deleteDeal(id: String) async throws {
        _ = try await makeRequest(path: "deals", method: "DELETE", queryParams: "?id=eq.\(id)")
    }

    func updateDealStage(id: String, stage: DealStage) async throws {
        let body = try JSONEncoder().encode(["stage": stage.rawValue])
        _ = try await makeRequest(path: "deals", method: "PATCH",
                                   body: body, queryParams: "?id=eq.\(id)")
    }

    // MARK: - Tasks
    func fetchTasks(dealId: String) async throws -> [DealTask] {
        let data = try await makeRequest(path: "deal_tasks",
                                          queryParams: "?deal_id=eq.\(dealId)&order=created_at.asc")
        return try JSONDecoder().decode([DealTask].self, from: data)
    }

    func createTask(_ task: DealTask) async throws -> DealTask {
        let body = try JSONEncoder().encode(task)
        let data = try await makeRequest(path: "deal_tasks", method: "POST", body: body)
        let tasks = try JSONDecoder().decode([DealTask].self, from: data)
        guard let created = tasks.first else { throw SupabaseError.noData }
        return created
    }

    func updateTask(_ task: DealTask) async throws {
        let body = try JSONEncoder().encode(task)
        _ = try await makeRequest(path: "deal_tasks", method: "PATCH",
                                   body: body, queryParams: "?id=eq.\(task.id)")
    }

    func deleteTask(id: String) async throws {
        _ = try await makeRequest(path: "deal_tasks", method: "DELETE",
                                   queryParams: "?id=eq.\(id)")
    }

    // MARK: - Workspaces
    func fetchWorkspaces() async throws -> [Workspace] {
        guard let userId = AuthService.shared.currentUserId else {
            throw SupabaseError.notAuthenticated
        }
        let data = try await makeRequest(
            path: "workspaces",
            queryParams: "?owner_id=eq.\(userId)"
        )
        return try JSONDecoder().decode([Workspace].self, from: data)
    }

    // MARK: - Dashboard Stats
    func fetchDashboardStats() async throws -> DashboardStats {
        let deals = try await fetchDeals()

        let activeDeals = deals.filter { $0.stage.isActive }
        let closedDeals = deals.filter { $0.stage == .closed }
        let totalPipeline = activeDeals.compactMap { $0.raiseAmount }.reduce(0, +)
        let estimatedFees = deals.compactMap { $0.estimatedFee }.reduce(0, +)

        var stageBreakdown: [String: Int] = [:]
        for stage in DealStage.allCases {
            stageBreakdown[stage.rawValue] = deals.filter { $0.stage == stage }.count
        }

        var sectorBreakdown: [String: Int] = [:]
        for deal in deals {
            if let sector = deal.sector {
                sectorBreakdown[sector, default: 0] += 1
            }
        }

        return DashboardStats(
            totalDeals: deals.count,
            activeDeals: activeDeals.count,
            closedDeals: closedDeals.count,
            totalPipeline: totalPipeline,
            estimatedFees: estimatedFees,
            stageBreakdown: stageBreakdown,
            sectorBreakdown: sectorBreakdown,
            recentDeals: Array(deals.prefix(5))
        )
    }
}

// MARK: - Dashboard Stats
struct DashboardStats {
    var totalDeals: Int
    var activeDeals: Int
    var closedDeals: Int
    var totalPipeline: Double
    var estimatedFees: Double
    var stageBreakdown: [String: Int]
    var sectorBreakdown: [String: Int]
    var recentDeals: [Deal]
}
