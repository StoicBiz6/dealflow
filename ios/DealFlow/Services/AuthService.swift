import Foundation
import AuthenticationServices

// MARK: - Clerk Auth Response Models
private struct ClerkSignInResponse: Codable {
    struct Response: Codable {
        var id: String?
        var status: String?
        struct CreatedSession: Codable {
            var id: String?
            var lastActiveToken: LastActiveToken?
            enum CodingKeys: String, CodingKey {
                case id
                case lastActiveToken = "last_active_token"
            }
        }
        var createdSessionId: String?
        var createdSession: CreatedSession?
        enum CodingKeys: String, CodingKey {
            case id, status
            case createdSessionId = "created_session_id"
            case createdSession = "created_session"
        }
    }
    var response: Response?
    var client: ClerkClient?
}

private struct LastActiveToken: Codable {
    var jwt: String?
}

private struct ClerkClient: Codable {
    var sessions: [ClerkSession]?
}

private struct ClerkSession: Codable {
    var id: String?
    var status: String?
    var lastActiveToken: LastActiveToken?
    enum CodingKeys: String, CodingKey {
        case id, status
        case lastActiveToken = "last_active_token"
    }
}

private struct ClerkUserResponse: Codable {
    var id: String?
    struct EmailAddress: Codable {
        var emailAddress: String?
        enum CodingKeys: String, CodingKey { case emailAddress = "email_address" }
    }
    var emailAddresses: [EmailAddress]?
    var firstName: String?
    var lastName: String?
    var imageUrl: String?
    enum CodingKeys: String, CodingKey {
        case id
        case emailAddresses = "email_addresses"
        case firstName = "first_name"
        case lastName = "last_name"
        case imageUrl = "image_url"
    }
}

// MARK: - Auth Error
enum AuthError: LocalizedError {
    case invalidCredentials
    case networkError(String)
    case sessionExpired
    case unknown

    var errorDescription: String? {
        switch self {
        case .invalidCredentials: return "Invalid email or password."
        case .networkError(let msg): return "Network error: \(msg)"
        case .sessionExpired: return "Your session has expired. Please sign in again."
        case .unknown: return "An unknown error occurred."
        }
    }
}

// MARK: - Auth Service
@MainActor
final class AuthService: ObservableObject {
    static let shared = AuthService()

    @Published var isSignedIn: Bool = false
    @Published var currentUserId: String? = nil
    @Published var currentUserEmail: String? = nil
    @Published var currentUserName: String? = nil
    @Published var sessionToken: String? = nil

    private let keychain = KeychainManager.shared

    private init() {
        loadStoredSession()
    }

    private func loadStoredSession() {
        if let token = keychain.get(forKey: Constants.KeychainKeys.sessionToken),
           !token.isEmpty {
            sessionToken = token
            currentUserId = keychain.get(forKey: Constants.KeychainKeys.userId)
            currentUserEmail = keychain.get(forKey: Constants.KeychainKeys.userEmail)
            currentUserName = keychain.get(forKey: Constants.KeychainKeys.userName)
            isSignedIn = true
        }
    }

    // MARK: - Sign In with Email/Password via Clerk Frontend API
    func signIn(email: String, password: String) async throws {
        let apiURL = "\(Constants.clerkFrontendAPIURL)/v1/client/sign_ins?_clerk_js_version=5.0.0"
        guard let url = URL(string: apiURL) else { throw AuthError.unknown }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")
        request.setValue(Constants.clerkPublishableKey, forHTTPHeaderField: "x-publishable-key")
        request.httpBody = "identifier=\(email.urlEncoded)&password=\(password.urlEncoded)&strategy=password".data(using: .utf8)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else { throw AuthError.unknown }

        if httpResponse.statusCode == 422 || httpResponse.statusCode == 403 {
            throw AuthError.invalidCredentials
        }

        guard httpResponse.statusCode == 200 else {
            throw AuthError.networkError("Status \(httpResponse.statusCode)")
        }

        let decoded = try JSONDecoder().decode(ClerkSignInResponse.self, from: data)

        // Extract JWT from response
        var jwt: String? = nil
        if let token = decoded.response?.createdSession?.lastActiveToken?.jwt {
            jwt = token
        } else if let session = decoded.client?.sessions?.first(where: { $0.status == "active" }),
                  let token = session.lastActiveToken?.jwt {
            jwt = token
        }

        guard let token = jwt, !token.isEmpty else {
            // Try fetching the session token separately
            if let sessionId = decoded.response?.createdSessionId {
                try await fetchSessionToken(sessionId: sessionId)
                return
            }
            throw AuthError.invalidCredentials
        }

        let userId = decoded.client?.sessions?.first?.id ?? decoded.response?.createdSessionId ?? ""
        storeSession(token: token, userId: userId, email: email, name: nil)
    }

    private func fetchSessionToken(sessionId: String) async throws {
        let apiURL = "\(Constants.clerkFrontendAPIURL)/v1/client/sessions/\(sessionId)/tokens?_clerk_js_version=5.0.0"
        guard let url = URL(string: apiURL) else { throw AuthError.unknown }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue(Constants.clerkPublishableKey, forHTTPHeaderField: "x-publishable-key")

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            throw AuthError.invalidCredentials
        }

        struct TokenResponse: Codable { var jwt: String? }
        let decoded = try JSONDecoder().decode(TokenResponse.self, from: data)
        guard let token = decoded.jwt else { throw AuthError.invalidCredentials }
        storeSession(token: token, userId: sessionId, email: nil, name: nil)
    }

    private func storeSession(token: String, userId: String, email: String?, name: String?) {
        sessionToken = token
        currentUserId = userId
        currentUserEmail = email
        currentUserName = name
        isSignedIn = true

        keychain.save(token, forKey: Constants.KeychainKeys.sessionToken)
        keychain.save(userId, forKey: Constants.KeychainKeys.userId)
        if let e = email { keychain.save(e, forKey: Constants.KeychainKeys.userEmail) }
        if let n = name { keychain.save(n, forKey: Constants.KeychainKeys.userName) }
    }

    func signOut() {
        sessionToken = nil
        currentUserId = nil
        currentUserEmail = nil
        currentUserName = nil
        isSignedIn = false
        keychain.clear()
    }

    // MARK: - Token refresh (call before API requests)
    func refreshTokenIfNeeded() async {
        // JWT tokens typically expire after 1 hour; re-sign-in if needed
        // For production, implement token refresh via Clerk session refresh endpoint
    }
}

// MARK: - String URL encoding helper
private extension String {
    var urlEncoded: String {
        return addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed)?
            .replacingOccurrences(of: "+", with: "%2B") ?? self
    }
}
