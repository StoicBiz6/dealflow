import Foundation
import Combine

@MainActor
final class AppViewModel: ObservableObject {
    static let shared = AppViewModel()

    // MARK: - State
    @Published var deals: [Deal] = []
    @Published var isLoading: Bool = false
    @Published var error: String? = nil
    @Published var selectedWorkspaceId: String? = nil

    private let supabase = SupabaseService.shared

    private init() {}

    // MARK: - Fetch
    func fetchDeals() async {
        isLoading = true
        error = nil
        do {
            deals = try await supabase.fetchDeals(workspaceId: selectedWorkspaceId)
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }

    // MARK: - Create
    func createDeal(companyName: String, stage: DealStage, sector: String?,
                    raiseAmount: Double?, notes: String?) async throws -> Deal {
        guard let userId = AuthService.shared.currentUserId else {
            throw SupabaseError.notAuthenticated
        }
        let deal = Deal(
            id: UUID().uuidString,
            companyName: companyName,
            stage: stage,
            raiseAmount: raiseAmount,
            sector: sector,
            notes: notes,
            userId: userId,
            workspaceId: selectedWorkspaceId
        )
        let created = try await supabase.createDeal(deal)
        deals.insert(created, at: 0)
        return created
    }

    // MARK: - Update
    func updateDeal(_ deal: Deal) async throws {
        let updated = try await supabase.updateDeal(deal)
        if let idx = deals.firstIndex(where: { $0.id == deal.id }) {
            deals[idx] = updated
        }
    }

    func updateStage(dealId: String, stage: DealStage) async throws {
        try await supabase.updateDealStage(id: dealId, stage: stage)
        if let idx = deals.firstIndex(where: { $0.id == dealId }) {
            deals[idx].stage = stage
        }
    }

    // MARK: - Delete
    func deleteDeal(id: String) async throws {
        try await supabase.deleteDeal(id: id)
        deals.removeAll { $0.id == id }
    }

    // MARK: - Computed
    var dealsByStage: [DealStage: [Deal]] {
        var result: [DealStage: [Deal]] = [:]
        for stage in DealStage.allCases {
            result[stage] = deals.filter { $0.stage == stage }
        }
        return result
    }

    var totalPipeline: Double {
        deals.filter { $0.stage.isActive }.compactMap { $0.raiseAmount }.reduce(0, +)
    }

    var activeDealsCount: Int {
        deals.filter { $0.stage.isActive }.count
    }

    var closedDealsCount: Int {
        deals.filter { $0.stage == .closed }.count
    }

    var estimatedFees: Double {
        deals.compactMap { $0.estimatedFee }.reduce(0, +)
    }

    var staleDeals: [Deal] {
        let cutoff = Calendar.current.date(byAdding: .day, value: -Constants.staleDeadDays, to: Date())!
        return deals.filter { deal in
            guard deal.stage.isActive,
                  let updatedStr = deal.updatedAt,
                  let updated = ISO8601DateFormatter().date(from: updatedStr) else { return false }
            return updated < cutoff
        }
    }
}
