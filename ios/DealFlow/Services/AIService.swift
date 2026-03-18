import Foundation

// MARK: - AI Service (connects to existing Vercel API endpoints)
final class AIService {
    static let shared = AIService()
    private init() {}

    private var baseURL: String { Constants.vercelBaseURL }

    private func post<T: Decodable>(endpoint: String, body: [String: Any]) async throws -> T {
        guard let url = URL(string: "\(baseURL)\(endpoint)") else {
            throw URLError(.badURL)
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token = AuthService.shared.sessionToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            let msg = String(data: data, encoding: .utf8) ?? "Unknown error"
            throw NSError(domain: "AIService", code: -1,
                          userInfo: [NSLocalizedDescriptionKey: msg])
        }
        return try JSONDecoder().decode(T.self, from: data)
    }

    // MARK: - Parse natural language deal intake
    func parseDealFromText(_ message: String) async throws -> DealChatResponse {
        return try await post(endpoint: "/api/chat", body: ["message": message])
    }

    // MARK: - Parse voice transcript
    func parseDealFromVoice(_ transcript: String) async throws -> DealChatResponse {
        return try await post(endpoint: "/api/voice-update", body: ["transcript": transcript])
    }

    // MARK: - Generate email
    func generateEmail(deal: Deal, contactName: String, purpose: String) async throws -> EmailResponse {
        let dealDict: [String: Any] = [
            "company_name": deal.companyName,
            "stage": deal.stage.rawValue,
            "sector": deal.sector ?? "",
            "raise_amount": deal.raiseAmount ?? 0,
            "notes": deal.notes ?? ""
        ]
        return try await post(endpoint: "/api/generate-email",
                               body: ["deal": dealDict, "contactName": contactName, "purpose": purpose])
    }

    // MARK: - Find buyers
    func findBuyers(deal: Deal) async throws -> BuyersResponse {
        let dealDict: [String: Any] = [
            "company_name": deal.companyName,
            "stage": deal.stage.rawValue,
            "sector": deal.sector ?? "",
            "raise_amount": deal.raiseAmount ?? 0
        ]
        return try await post(endpoint: "/api/find-buyers",
                               body: ["deal": dealDict, "types": ["strategic", "financial"]])
    }
}

// MARK: - Response Models
struct DealChatResponse: Codable {
    var companyName: String?
    var stage: String?
    var sector: String?
    var raiseAmount: Double?
    var valuation: Double?
    var notes: String?
    var dealOwner: String?
    var message: String?

    enum CodingKeys: String, CodingKey {
        case companyName = "company_name"
        case stage, sector
        case raiseAmount = "raise_amount"
        case valuation, notes
        case dealOwner = "deal_owner"
        case message
    }

    func applyTo(deal: inout Deal) {
        if let name = companyName, !name.isEmpty { deal.companyName = name }
        if let stageStr = stage, let s = DealStage(rawValue: stageStr) { deal.stage = s }
        if let s = sector, !s.isEmpty { deal.sector = s }
        if let r = raiseAmount { deal.raiseAmount = r }
        if let v = valuation { deal.valuation = v }
        if let n = notes, !n.isEmpty { deal.notes = n }
        if let o = dealOwner, !o.isEmpty { deal.dealOwner = o }
    }
}

struct EmailResponse: Codable {
    var subject: String?
    var body: String?
    var email: String?
}

struct BuyersResponse: Codable {
    var buyers: [Buyer]?
    struct Buyer: Codable {
        var name: String
        var type: String?
        var rationale: String?
    }
}
