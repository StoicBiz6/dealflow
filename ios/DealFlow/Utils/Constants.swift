import Foundation

enum Constants {
    // MARK: - Supabase
    // Replace with your actual Supabase URL and anon key
    static let supabaseURL = ProcessInfo.processInfo.environment["SUPABASE_URL"]
        ?? "https://YOUR_PROJECT.supabase.co"
    static let supabaseAnonKey = ProcessInfo.processInfo.environment["SUPABASE_ANON_KEY"]
        ?? "YOUR_SUPABASE_ANON_KEY"

    // MARK: - Vercel API
    // Replace with your deployed Vercel app URL
    static let vercelBaseURL = ProcessInfo.processInfo.environment["VERCEL_URL"]
        ?? "https://dealflow-zeta.vercel.app"

    // MARK: - Clerk
    // Your Clerk publishable key (pk_live_... or pk_test_...)
    static let clerkPublishableKey = ProcessInfo.processInfo.environment["CLERK_PUBLISHABLE_KEY"]
        ?? "YOUR_CLERK_PUBLISHABLE_KEY"

    // Derived from publishable key: pk_test_XXXXX -> XXXXX.clerk.accounts.dev
    static var clerkFrontendAPIURL: String {
        let key = clerkPublishableKey
        if key.hasPrefix("pk_test_") {
            let encoded = String(key.dropFirst("pk_test_".count))
            if let decoded = Data(base64Encoded: encoded + "=="),
               let domain = String(data: decoded, encoding: .utf8)?.trimmingCharacters(in: .init(charactersIn: "$")) {
                return "https://\(domain)"
            }
        } else if key.hasPrefix("pk_live_") {
            let encoded = String(key.dropFirst("pk_live_".count))
            if let decoded = Data(base64Encoded: encoded + "=="),
               let domain = String(data: decoded, encoding: .utf8)?.trimmingCharacters(in: .init(charactersIn: "$")) {
                return "https://\(domain)"
            }
        }
        return "https://clerk.YOUR_DOMAIN.com"
    }

    // MARK: - Keychain Keys
    enum KeychainKeys {
        static let sessionToken = "clerk_session_token"
        static let userId = "clerk_user_id"
        static let userEmail = "user_email"
        static let userName = "user_name"
    }

    // MARK: - App
    static let appName = "DealFlow"
    static let urlScheme = "dealflow"
    static let staleDeadDays = 14
}
