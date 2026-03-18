import Foundation
import SwiftUI

// MARK: - Deal Stage
enum DealStage: String, Codable, CaseIterable, Identifiable {
    case sourced = "Sourced"
    case investorTargeting = "Investor Targeting"
    case diligence = "Diligence"
    case termSheet = "Term Sheet"
    case negotiation = "Negotiation"
    case closed = "Closed"
    case passed = "Passed"

    var id: String { rawValue }

    var color: Color {
        switch self {
        case .sourced: return .blue
        case .investorTargeting: return .purple
        case .diligence: return .orange
        case .termSheet: return Color(red: 0.8, green: 0.6, blue: 0.0)
        case .negotiation: return .teal
        case .closed: return .green
        case .passed: return .red
        }
    }

    var isActive: Bool {
        return self != .closed && self != .passed
    }

    var emoji: String {
        switch self {
        case .sourced: return "🔍"
        case .investorTargeting: return "🎯"
        case .diligence: return "📋"
        case .termSheet: return "📄"
        case .negotiation: return "🤝"
        case .closed: return "✅"
        case .passed: return "❌"
        }
    }
}

// MARK: - Deal Model
struct Deal: Identifiable, Codable, Equatable {
    var id: String
    var companyName: String
    var stage: DealStage
    var raiseAmount: Double?
    var valuation: Double?
    var sector: String?
    var dealOwner: String?
    var website: String?
    var notes: String?
    var userId: String?
    var workspaceId: String?
    var feePct: Double?
    var timelineToClose: String?
    var memo: String?
    var contacts: [DealContact]?
    var coInvestors: [String]?
    var buyers: [Buyer]?
    var metrics: DealMetrics?
    var score: DealScore?
    var createdAt: String?
    var updatedAt: String?

    enum CodingKeys: String, CodingKey {
        case id
        case companyName = "company_name"
        case stage
        case raiseAmount = "raise_amount"
        case valuation
        case sector
        case dealOwner = "deal_owner"
        case website
        case notes
        case userId = "user_id"
        case workspaceId = "workspace_id"
        case feePct = "fee_pct"
        case timelineToClose = "timeline_to_close"
        case memo
        case contacts
        case coInvestors = "co_investors"
        case buyers
        case metrics
        case score
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }

    static func == (lhs: Deal, rhs: Deal) -> Bool {
        lhs.id == rhs.id
    }

    var estimatedFee: Double? {
        guard let raise = raiseAmount, let pct = feePct else { return nil }
        return raise * (pct / 100.0)
    }
}

// MARK: - Supporting Models
struct DealContact: Codable, Identifiable, Equatable {
    var id: String
    var name: String
    var title: String?
    var email: String?
    var notes: String?

    init(id: String = UUID().uuidString, name: String, title: String? = nil,
         email: String? = nil, notes: String? = nil) {
        self.id = id
        self.name = name
        self.title = title
        self.email = email
        self.notes = notes
    }
}

struct Buyer: Codable, Identifiable, Equatable {
    var id: String
    var name: String
    var type: String?
    var rationale: String?

    init(id: String = UUID().uuidString, name: String,
         type: String? = nil, rationale: String? = nil) {
        self.id = id
        self.name = name
        self.type = type
        self.rationale = rationale
    }
}

struct DealMetrics: Codable, Equatable {
    var revenue: Double?
    var ebitda: Double?
    var ebitdaMargin: Double?
    var arr: Double?
    var growthRate: Double?
    var grossMargin: Double?
    var employees: Int?
    var founded: String?
    var other: String?

    enum CodingKeys: String, CodingKey {
        case revenue, ebitda
        case ebitdaMargin = "ebitda_margin"
        case arr
        case growthRate = "growth_rate"
        case grossMargin = "gross_margin"
        case employees, founded, other
    }
}

struct DealScore: Codable, Equatable {
    var team: Int?
    var market: Int?
    var traction: Int?
    var terms: Int?
    var overall: Int?
    var rationale: String?
}

// MARK: - Sector Options
enum DealSector: String, CaseIterable {
    case technology = "Technology"
    case gaming = "Gaming"
    case mediaEntertainment = "Media & Entertainment"
    case hospitality = "Hospitality"
    case sports = "Sports"
    case healthcare = "Healthcare"
    case consumer = "Consumer"
    case finance = "Finance"
    case realEstate = "Real Estate"
    case other = "Other"
}
