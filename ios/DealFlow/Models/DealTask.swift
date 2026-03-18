import Foundation

struct DealTask: Identifiable, Codable, Equatable {
    var id: String
    var dealId: String
    var title: String
    var completed: Bool
    var dueDate: String?
    var createdAt: String?

    init(id: String = UUID().uuidString, dealId: String, title: String,
         completed: Bool = false, dueDate: String? = nil) {
        self.id = id
        self.dealId = dealId
        self.title = title
        self.completed = completed
        self.dueDate = dueDate
        self.createdAt = ISO8601DateFormatter().string(from: Date())
    }

    enum CodingKeys: String, CodingKey {
        case id
        case dealId = "deal_id"
        case title, completed
        case dueDate = "due_date"
        case createdAt = "created_at"
    }

    var isOverdue: Bool {
        guard let dueDateStr = dueDate,
              let date = ISO8601DateFormatter().date(from: dueDateStr) else { return false }
        return !completed && date < Date()
    }
}
