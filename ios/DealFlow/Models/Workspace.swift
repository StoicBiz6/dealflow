import Foundation

struct Workspace: Identifiable, Codable, Equatable {
    var id: String
    var name: String
    var ownerId: String
    var inviteCode: String?
    var createdAt: String?

    enum CodingKeys: String, CodingKey {
        case id, name
        case ownerId = "owner_id"
        case inviteCode = "invite_code"
        case createdAt = "created_at"
    }
}

struct WorkspaceMember: Codable {
    var workspaceId: String
    var userId: String
    var role: String
    var joinedAt: String?

    enum CodingKeys: String, CodingKey {
        case workspaceId = "workspace_id"
        case userId = "user_id"
        case role
        case joinedAt = "joined_at"
    }
}

struct UserProfile: Identifiable, Codable {
    var id: String { userId }
    var userId: String
    var fullName: String?
    var email: String?
    var avatarUrl: String?
    var updatedAt: String?

    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case fullName = "full_name"
        case email
        case avatarUrl = "avatar_url"
        case updatedAt = "updated_at"
    }
}
